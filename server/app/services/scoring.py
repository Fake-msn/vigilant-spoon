"""Scoring service: turn a conversation transcript into a ScoreCard.

The current implementation is a deterministic demo scorer. It looks for
Chinese keywords that map to a small rubric and returns evidence spans
anchored to the original transcript.  It never invents evidence.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.schemas import EvidenceItem, ScoreCard

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


def score_transcript(
    session_id: str,
    student_id: str,
    transcript: str,
    profile: dict[str, object] | None = None,
) -> ScoreCard:
    """Score a transcript and return a ScoreCard with aligned evidence.

    The scorer is intentionally conservative: a dimension only scores when at
    least one keyword is found in the transcript, and each keyword contributes
    at most once.
    """
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
