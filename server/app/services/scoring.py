"""Scoring service: turn a conversation transcript into a ScoreCard.

The current implementation is a deterministic demo scorer. It looks for
Chinese keywords that map to a small rubric and returns evidence spans
anchored to the original transcript.  It never invents evidence.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from app.schemas import EvidenceItem, ScoreCard
from app.services.llm import chat_completion

logger = logging.getLogger("scoring")

RUBRIC: dict[str, tuple[int, list[str]]] = {
    "expression": (25, ["觉得", "想", "说", "告诉", "分享"]),
    "thinking": (25, ["为什么", "因为", "如果", "所以", "怎么办"]),
    "confidence": (25, ["我相信", "我可以", "我要", "一定能", "我能"]),
    "engagement": (25, ["好", "是的", "还想", "继续", "喜欢"]),
}


def _find_spans(text: str, keywords: list[str]) -> list[tuple[int, int]]:
    """Return non-overlapping [start, end) spans for the first match of each keyword."""
    spans: list[tuple[int, int]] = []
    for keyword in keywords:
        pos = text.find(keyword)
        if pos == -1:
            continue
        spans.append((pos, pos + len(keyword)))
    return spans


def _score_with_llm(
    session_id: str,
    student_id: str,
    transcript: str,
) -> ScoreCard | None:
    """尝试用 LLM 打分；未配置 / 解析失败时返回 None 以回退关键词打分。

    只让 LLM 决定各维度分数与备注；证据 span 仍锚定到转写原文关键词，
    保证证据链真实可引用，绝不捏造偏移。
    """
    system = (
        "你是「小信」的评分助手。请根据学生对话转写，按四个维度打分，"
        "只输出 JSON，不要输出任何额外文字。格式："
        '{"dimensions": '
        '{"expression": 0-25, "thinking": 0-25, "confidence": 0-25, "engagement": 0-25},'
        ' "notes": {"expression": "说明", "thinking": "说明", '
        '"confidence": "说明", "engagement": "说明"}}'
    )
    user = "学生对话转写：\n" + (transcript[:4000] if transcript else "")
    text = chat_completion(system, user, max_tokens=600)
    if not text:
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("LLM 评分输出非 JSON，回退关键词打分")
        return None

    dimensions_raw = data.get("dimensions", {})
    notes_raw = data.get("notes", {})
    if not isinstance(dimensions_raw, dict):
        logger.warning("LLM 评分缺 dimensions，回退关键词打分")
        return None

    dimensions: dict[str, int] = {}
    for dim, (max_score, _keywords) in RUBRIC.items():
        try:
            val = int(dimensions_raw.get(dim, 0))
        except (TypeError, ValueError):
            val = 0
        dimensions[dim] = max(0, min(max_score, val))

    evidence: list[EvidenceItem] = []
    for dim, (_max_score, keywords) in RUBRIC.items():
        spans = _find_spans(transcript, keywords)
        if not spans:
            continue
        start, end = spans[0]
        note = str(notes_raw.get(dim, f"命中 {dim} 关键词：{transcript[start:end]}"))
        evidence.append(
            EvidenceItem(
                rubric_id=dim,
                quote_span=(start, end),
                source="transcript",
                note=note,
            )
        )

    total = sum(dimensions.values())
    return ScoreCard(
        session_id=session_id,
        student_id=student_id,
        dimensions=dimensions,
        total=total,
        evidence=evidence,
        created_at=datetime.now(timezone.utc),
    )


def score_transcript(
    session_id: str,
    student_id: str,
    transcript: str,
    profile: dict[str, object] | None = None,
) -> ScoreCard:
    """Score a transcript and return a ScoreCard with aligned evidence.

    The scorer is intentionally conservative: a dimension only scores when at
    least one keyword is found in the transcript, and each keyword contributes
    at most once.  When text_provider is configured, an LLM-first pass is
    attempted and falls back to this deterministic scorer on any failure.
    """
    llm = _score_with_llm(session_id, student_id, transcript)
    if llm is not None:
        return llm

    dimensions: dict[str, int] = {}
    evidence: list[EvidenceItem] = []

    for dimension, (max_score, keywords) in RUBRIC.items():
        spans = _find_spans(transcript, keywords)
        if not spans:
            dimensions[dimension] = 0
            continue

        score_per_hit = max(1, max_score // len(keywords))
        dimension_score = min(max_score, score_per_hit * len(spans))
        dimensions[dimension] = dimension_score

        for start, end in spans:
            evidence.append(
                EvidenceItem(
                    rubric_id=dimension,
                    quote_span=(start, end),
                    source="transcript",
                    note=f"命中 {dimension} 关键词：{transcript[start:end]}",
                )
            )

    # Small profile bonus with evidence anchored to a synthetic profile note.
    if profile and profile.get("ideal"):
        ideal = str(profile["ideal"])
        if ideal in transcript:
            pos = transcript.find(ideal)
            evidence.append(
                EvidenceItem(
                    rubric_id="expression",
                    quote_span=(pos, pos + len(ideal)),
                    source="profile",
                    note=f"谈到自己的理想：{ideal}",
                )
            )

    total = sum(dimensions.values())

    return ScoreCard(
        session_id=session_id,
        student_id=student_id,
        dimensions=dimensions,
        total=total,
        evidence=evidence,
        created_at=datetime.now(timezone.utc),
    )
