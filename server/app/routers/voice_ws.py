"""WebSocket voice endpoint (F2-04).

遵循 WS 铁律：上行二进制 PCM16 帧，下行 JSON 事件。
鉴权通过 query param `token` 完成（浏览器 WS 无法自定义 header）。
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.db import get_db_connection
from app.schemas.voice import VoiceMode
from app.services.voice import create_voice_provider, load_voice_context

logger = logging.getLogger("voice_ws")

router = APIRouter(tags=["voice"])

# WebSocket 私有关闭码：4401=未认证/Token 无效，4409=学生身份不匹配
CLOSE_UNAUTHORIZED = 4401
CLOSE_FORBIDDEN = 4409


def _validate_token(token: str | None) -> tuple[str, str]:
    """Return (student_id, class_code) or raise ValueError."""
    if not token or not token.startswith("st_"):
        raise ValueError("TOKEN_INVALID")

    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT student_id, class_code, expires_at FROM sessions WHERE token = ?",
            (token,),
        ).fetchone()
        if row is None:
            raise ValueError("TOKEN_INVALID")

        expires_at = datetime.fromisoformat(row["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise ValueError("TOKEN_EXPIRED")

        return str(row["student_id"]), str(row["class_code"])
    finally:
        conn.close()


@router.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket) -> None:
    """Establish a realtime voice session for the authenticated student."""
    query = dict(websocket.query_params)
    token = query.get("token")

    try:
        student_id, _class_code = _validate_token(token)
    except ValueError as exc:
        code = str(exc)
        await websocket.close(code=CLOSE_UNAUTHORIZED, reason=code)
        return

    requested_student = query.get("student_id", student_id)
    if requested_student != student_id:
        await websocket.close(code=CLOSE_FORBIDDEN, reason="STUDENT_MISMATCH")
        return

    mode: VoiceMode = "classroom"
    raw_mode = query.get("mode", "classroom")
    if raw_mode in {"classroom", "journal", "lesson"}:
        mode = raw_mode  # type: ignore[assignment]

    await websocket.accept()

    try:
        ctx = load_voice_context(student_id, mode)
    except ValueError as exc:
        logger.warning("load voice context failed: %s", exc)
        await websocket.close(code=CLOSE_FORBIDDEN, reason="STUDENT_NOT_FOUND")
        return

    provider = create_voice_provider(ctx)
    send_task: asyncio.Task[None] | None = None
    receive_task: asyncio.Task[None] | None = None
    stop_event = asyncio.Event()

    async def _send_loop() -> None:
        try:
            async for event in provider.start():
                payload = event.model_dump(by_alias=True, exclude_none=True)
                await websocket.send_json(payload)
                if event.type == "session_end":
                    break
        except Exception:
            logger.exception("voice send loop error")
        finally:
            stop_event.set()

    async def _receive_loop() -> None:
        try:
            while not stop_event.is_set():
                raw = await websocket.receive()
                if "bytes" in raw:
                    pcm16 = raw["bytes"]
                    if isinstance(pcm16, bytes):
                        provider.send_audio(pcm16)
                elif "text" in raw:
                    text = raw["text"]
                    if isinstance(text, str):
                        try:
                            msg = json.loads(text)
                        except json.JSONDecodeError:
                            continue
                        if msg.get("type") == "commit_turn":
                            provider.commit_turn()
                else:
                    # 连接关闭或未知帧
                    break
        except WebSocketDisconnect:
            logger.info("client disconnected")
        except Exception:
            logger.exception("voice receive loop error")
        finally:
            stop_event.set()

    send_task = asyncio.create_task(_send_loop())
    receive_task = asyncio.create_task(_receive_loop())

    await stop_event.wait()

    if receive_task is not None and not receive_task.done():
        receive_task.cancel()
    if send_task is not None and not send_task.done():
        send_task.cancel()

    await provider.stop()

    try:
        await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
    except Exception:
        pass
