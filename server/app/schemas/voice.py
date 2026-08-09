"""语音会话事件 schema（F2）。

遵循 WS 铁律：上行二进制 PCM16 帧，下行 JSON 事件。
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

VoiceMode = Literal["classroom", "journal", "lesson"]


# ---------------------------------------------------------------------------
# 服务端下发事件
# ---------------------------------------------------------------------------
class VoiceEvent(BaseModel):
    type: str


class SessionStartedEvent(VoiceEvent):
    type: Literal["session_started"] = "session_started"


class VADStartEvent(VoiceEvent):
    type: Literal["vad_start"] = "vad_start"


class VADEndEvent(VoiceEvent):
    type: Literal["vad_end"] = "vad_end"


class TranscriptEvent(VoiceEvent):
    type: Literal["transcript"] = "transcript"
    from_: Literal["me", "ai"] = Field(..., alias="from")
    text: str


class AudioChunkEvent(VoiceEvent):
    type: Literal["audio_chunk"] = "audio_chunk"
    data: str = ""  # base64 PCM16；演示期可只发占位
    rate: int = 24000  # 输出采样率，供前端按相同采样率解码播放


class ImageEvent(VoiceEvent):
    type: Literal["image"] = "image"
    kind: Literal["cake", "dream"]


class TurnEndEvent(VoiceEvent):
    type: Literal["turn_end"] = "turn_end"


class SessionEndEvent(VoiceEvent):
    type: Literal["session_end"] = "session_end"
    reason: str | None = None


class VoiceErrorEvent(VoiceEvent):
    type: Literal["error"] = "error"
    code: str
    message: str


ServerVoiceEvent = (
    SessionStartedEvent
    | VADStartEvent
    | VADEndEvent
    | TranscriptEvent
    | AudioChunkEvent
    | ImageEvent
    | TurnEndEvent
    | SessionEndEvent
    | VoiceErrorEvent
)


# ---------------------------------------------------------------------------
# 客户端 JSON 信令（除音频二进制帧外）
# ---------------------------------------------------------------------------
class ClientVoiceEvent(BaseModel):
    type: str


class CommitTurnEvent(ClientVoiceEvent):
    """学生端主动结束当前说话轮次。"""

    type: Literal["commit_turn"] = "commit_turn"


ClientVoiceEventUnion = CommitTurnEvent


# ---------------------------------------------------------------------------
# 连接参数
# ---------------------------------------------------------------------------
class VoiceSessionReq(BaseModel):
    mode: VoiceMode = "classroom"
    student_id: str
