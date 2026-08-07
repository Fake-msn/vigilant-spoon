"""语音服务与 provider 抽象（F2）。

默认使用 local 脚本 fallback，不消耗模型额度；配置 `voice_provider=dashscope`
且 `dashscope_api_key` 有效时连接 DashScope realtime。
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any

import websockets

from app.config import settings
from app.db import get_db_connection
from app.schemas.voice import (
    AudioChunkEvent,
    ImageEvent,
    ServerVoiceEvent,
    SessionEndEvent,
    SessionStartedEvent,
    TranscriptEvent,
    TurnEndEvent,
    VADEndEvent,
    VADStartEvent,
    VoiceErrorEvent,
    VoiceMode,
)

logger = logging.getLogger("voice")


@dataclass(frozen=True)
class VoiceContext:
    """一次语音会话所需的最小上下文。"""

    student_id: str
    student_name: str
    grade: str
    class_code: str
    mode: VoiceMode
    ideal: str | None
    last_gist: str | None
    teacher_note: str | None
    scores_summary: str
    role: str


def load_voice_context(student_id: str, mode: VoiceMode) -> VoiceContext:
    """从数据库加载学生上下文，用于注入 system prompt。"""
    conn = get_db_connection()
    try:
        row = conn.execute(
            """
            SELECT s.student_id, s.name, s.grade, s.class_code, s.ideal, s.role,
                   g.last_gist,
                   a.teacher_note,
                   a.scores AS scores
            FROM students s
            LEFT JOIN growth_records g ON s.student_id = g.student_id
            LEFT JOIN academic_records a ON s.student_id = a.student_id
            WHERE s.student_id = ?
            ORDER BY a.updated_at DESC
            LIMIT 1
            """,
            (student_id,),
        ).fetchone()
        if row is None:
            raise ValueError(f"学生不存在: {student_id}")

        scores = row["scores"] or "[]"
        try:
            scores_obj = json.loads(scores)
        except json.JSONDecodeError:
            scores_obj = []
        if not isinstance(scores_obj, list):
            scores_obj = []
        summary = ", ".join(
            f"{s.get('subject', '?')}{s.get('score', '?')}"
            for s in scores_obj
            if isinstance(s, dict)
        )

        return VoiceContext(
            student_id=row["student_id"],
            student_name=row["name"],
            grade=row["grade"],
            class_code=row["class_code"],
            mode=mode,
            ideal=row["ideal"],
            last_gist=row["last_gist"],
            teacher_note=row["teacher_note"],
            scores_summary=summary or "无",
            role=row["role"] or "member",
        )
    finally:
        conn.close()


def build_system_prompt(ctx: VoiceContext) -> str:
    """按三角色拼接 system prompt，注入成绩、角色、教师评语。"""
    base = (
        f"你是小信，{ctx.class_code}的AI伙伴。"
        f"当前学生是{ctx.grade}{ctx.student_name}，"
        f"校内角色：{ctx.role}。"
    )
    if ctx.ideal:
        base += f"ta 的梦想是成为一名{ctx.ideal}。"
    if ctx.last_gist:
        base += f"最近一次谈心：{ctx.last_gist}。"
    if ctx.teacher_note:
        base += f"老师备注：{ctx.teacher_note}。"
    base += f"最近成绩：{ctx.scores_summary}。"

    if ctx.mode == "classroom":
        base += (
            "当前为课堂模式。请围绕思政课主题，用温暖、简短的口语引导学生说出具体理想，"
            "并鼓励他做一件本周能完成的小事。"
        )
    elif ctx.mode == "journal":
        base += (
            "当前为成长日记模式。请帮学生回顾今天的努力，肯定积极行为，"
            "如果检测到低落信号，请给出温柔支持。"
        )
    else:
        base += (
            "当前为备课/复习模式。请根据课程目标与学生背景，做简短对话热身。"
        )
    return base


# ---------------------------------------------------------------------------
# Provider 抽象
# ---------------------------------------------------------------------------
class VoiceProvider(ABC):
    @abstractmethod
    def start(self) -> AsyncIterator[ServerVoiceEvent]: ...

    @abstractmethod
    def send_audio(self, pcm16: bytes) -> None: ...

    @abstractmethod
    def commit_turn(self) -> None: ...

    @abstractmethod
    async def stop(self) -> None: ...


# ---------------------------------------------------------------------------
# Local fallback：按脚本回放，零模型依赖
# ---------------------------------------------------------------------------
LOCAL_SCRIPT: list[dict[str, Any]] = [
    {"from": "ai", "text": "你好呀，我是小信。今天想聊聊你的梦想吗？", "pause": 1.2},
    {"from": "me", "text": "我想当蛋糕师。", "pause": 0.9},
    {
        "from": "ai",
        "text": "蛋糕师很棒！要做蛋糕，数学可不能落下哦。这周能试着帮妈妈做一次点心吗？",
        "pause": 1.5,
    },
    {"from": "me", "text": "好的，我周末试试。", "pause": 0.8},
    {"from": "ai", "text": "太棒了，那我帮你记录下来。继续加油！", "image": "dream", "pause": 1.0},
]


class LocalVoiceProvider(VoiceProvider):
    """本地脚本 provider，用于演示期无额度时的稳定 fallback。"""

    def __init__(self, ctx: VoiceContext) -> None:
        self.ctx = ctx
        self._queue: asyncio.Queue[ServerVoiceEvent] = asyncio.Queue()
        self._running = True
        self._audio_buffer = bytearray()

    async def start(self) -> AsyncIterator[ServerVoiceEvent]:
        self._queue.put_nowait(SessionStartedEvent())
        asyncio.create_task(self._play_script())
        while self._running:
            event = await self._queue.get()
            yield event
            if event.type == "session_end":
                break

    async def _play_script(self) -> None:
        await asyncio.sleep(0.3)
        for item in LOCAL_SCRIPT:
            if not self._running:
                break
            if item.get("from") == "me":
                self._queue.put_nowait(VADStartEvent())
                await asyncio.sleep(0.3)
                self._queue.put_nowait(
                    TranscriptEvent.model_validate(
                        {"type": "transcript", "from": "me", "text": item["text"]}
                    )
                )
                self._queue.put_nowait(VADEndEvent())
            else:
                self._queue.put_nowait(VADStartEvent())
                await asyncio.sleep(0.2)
                self._queue.put_nowait(VADEndEvent())
                self._queue.put_nowait(AudioChunkEvent(data=""))
                self._queue.put_nowait(
                    TranscriptEvent.model_validate(
                        {"type": "transcript", "from": "ai", "text": item["text"]}
                    )
                )
                if "image" in item:
                    self._queue.put_nowait(ImageEvent(kind=item["image"]))
                self._queue.put_nowait(TurnEndEvent())
            await asyncio.sleep(item.get("pause", 1.0))
        self._queue.put_nowait(SessionEndEvent(reason="script_complete"))

    def send_audio(self, pcm16: bytes) -> None:
        # local 脚本忽略真实音频，仅统计长度用于日志
        self._audio_buffer.extend(pcm16)

    def commit_turn(self) -> None:
        logger.debug("local provider commit_turn (no-op)")

    async def stop(self) -> None:
        self._running = False
        self._queue.put_nowait(SessionEndEvent(reason="stopped"))


# ---------------------------------------------------------------------------
# DashScope realtime provider（OpenAI-realtime 兼容协议）
# ---------------------------------------------------------------------------
class DashScopeVoiceProvider(VoiceProvider):
    """连接 DashScope realtime endpoint；当前仅做事件透传骨架。"""

    def __init__(self, ctx: VoiceContext) -> None:
        self.ctx = ctx
        self._api_key = settings.dashscope_api_key or ""
        self._url = (
            f"{settings.dashscope_realtime_url}?model={settings.voice_model}"
        )
        self._queue: asyncio.Queue[ServerVoiceEvent] = asyncio.Queue()
        self._ws: Any = None
        self._running = False

    async def start(self) -> AsyncIterator[ServerVoiceEvent]:
        if not self._api_key:
            yield VoiceErrorEvent(
                code="MISSING_API_KEY",
                message="DASHSCOPE_API_KEY 未配置",
            )
            return

        self._running = True
        try:
            self._ws = await websockets.connect(
                self._url,
                additional_headers={"Authorization": f"Bearer {self._api_key}"},
            )
        except Exception as exc:
            logger.exception("connect realtime failed")
            yield VoiceErrorEvent(
                code="CONNECT_FAILED",
                message=f"连接实时模型失败: {exc}",
            )
            return

        asyncio.create_task(self._read_remote())
        await self._send(
            {
                "type": "session.update",
                "session": {
                    "modalities": ["text", "audio"],
                    "voice": "alloy",
                    "instructions": build_system_prompt(self.ctx),
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "turn_detection": {"type": "server_vad"},
                },
            }
        )

        while self._running:
            event = await self._queue.get()
            yield event
            if event.type == "session_end":
                break

    async def _read_remote(self) -> None:
        try:
            while self._ws is not None:
                raw = await self._ws.recv()
                if isinstance(raw, bytes):
                    continue
                msg = json.loads(raw)
                mapped = self._map_event(msg)
                if mapped is not None:
                    self._queue.put_nowait(mapped)
        except websockets.exceptions.ConnectionClosed as exc:
            logger.info("realtime connection closed: %s", exc)
            self._queue.put_nowait(
                SessionEndEvent(reason=f"remote_close_{exc.code}")
            )
            self._running = False
        except Exception:
            logger.exception("read remote error")

    def _map_event(self, msg: dict[str, Any]) -> ServerVoiceEvent | None:
        etype = msg.get("type")
        if etype == "session.created":
            return SessionStartedEvent()
        if etype == "input_audio_buffer.speech_started":
            return VADStartEvent()
        if etype == "input_audio_buffer.speech_stopped":
            return VADEndEvent()
        if etype == "conversation.item.input_audio_transcription.completed":
            return TranscriptEvent.model_validate(
                {"type": "transcript", "from": "me", "text": msg.get("transcript", "")}
            )
        if etype == "response.text.delta":
            return TranscriptEvent.model_validate(
                {"type": "transcript", "from": "ai", "text": msg.get("delta", "")}
            )
        if etype == "response.audio.delta":
            return AudioChunkEvent(data=msg.get("delta", ""))
        if etype == "response.done":
            return TurnEndEvent()
        if etype in {"session.expired", "error"}:
            return VoiceErrorEvent(
                code=msg.get("code", "REALTIME_ERROR"),
                message=msg.get("message", "unknown realtime error"),
            )
        return None

    async def _send(self, msg: dict[str, Any]) -> None:
        if self._ws is not None:
            await self._ws.send(json.dumps(msg))

    def send_audio(self, pcm16: bytes) -> None:
        if not pcm16:
            return
        asyncio.create_task(
            self._send(
                {
                    "type": "input_audio_buffer.append",
                    "audio": base64.b64encode(pcm16).decode("ascii"),
                }
            )
        )

    def commit_turn(self) -> None:
        asyncio.create_task(self._send({"type": "input_audio_buffer.commit"}))
        asyncio.create_task(self._send({"type": "response.create"}))

    async def stop(self) -> None:
        self._running = False
        if self._ws is not None:
            await self._ws.close()
        self._queue.put_nowait(SessionEndEvent(reason="stopped"))


def create_voice_provider(ctx: VoiceContext) -> VoiceProvider:
    if settings.voice_provider == "dashscope":
        return DashScopeVoiceProvider(ctx)
    return LocalVoiceProvider(ctx)
