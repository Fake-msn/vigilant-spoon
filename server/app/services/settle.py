"""Settlement orchestration: transcript -> score -> growth/pet update.

The whole chain is idempotent by session_id.
"""

from __future__ import annotations

import sqlite3
from datetime import datetime

from app.schemas import ScoreCard
from app.services.pet import (
    now_utc,
    pet_stage_for,
    species_for_ideal,
    stage_label_for,
    transition,
)
from app.services.scoring import score_transcript


def _load_growth(conn: sqlite3.Connection, student_id: str) -> sqlite3.Row:
    row = conn.execute(
        "SELECT * FROM growth_records WHERE student_id = ?", (student_id,)
    ).fetchone()
    if row is None:
        raise ValueError(f"growth record not found: {student_id}")
    return row  # type: ignore[no-any-return]


def _parse_dt(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


def settle_session(
    conn: sqlite3.Connection,
    session_id: str,
    student_id: str,
    transcript: str,
    profile: dict[str, object] | None = None,
    positive_signal: bool = False,
) -> ScoreCard:
    """Run the settlement chain idempotently."""
    existing = conn.execute(
        "SELECT score_card FROM settlements WHERE session_id = ?", (session_id,)
    ).fetchone()
    if existing is not None:
        return ScoreCard.model_validate_json(existing["score_card"])

    card = score_transcript(session_id, student_id, transcript, profile)
    row = _load_growth(conn, student_id)
    now = now_utc()

    growth_delta = min(20, max(0, card.total // 5))
    new_state, new_growth, new_last_growth_at, new_cheer_until, new_needs_care = transition(
        state=row["state"],
        growth_value=row["growth_value"],
        last_growth_at=_parse_dt(row["last_growth_at"]) or now,
        cheer_until=_parse_dt(row["cheer_until"]),
        now=now,
        growth_delta=growth_delta,
        positive_signal=positive_signal,
    )

    species = row["species"] or species_for_ideal(str(profile["ideal"]) if profile else None)

    conn.execute(
        """
        UPDATE growth_records SET
            state = ?, growth_value = ?, species = ?, pet_stage = ?,
            last_growth_at = ?, cheer_until = ?, needs_care = ?, stage = ?,
            updated_at = ?
        WHERE student_id = ?
        """,
        (
            new_state,
            new_growth,
            species,
            pet_stage_for(new_growth),
            new_last_growth_at.isoformat(),
            new_cheer_until.isoformat() if new_cheer_until else None,
            1 if new_needs_care else 0,
            stage_label_for(new_growth),
            now.isoformat(),
            student_id,
        ),
    )
    conn.execute(
        "INSERT INTO settlements (session_id, student_id, score_card, created_at) "
        "VALUES (?, ?, ?, ?)",
        (session_id, student_id, card.model_dump_json(), now.isoformat()),
    )
    conn.commit()
    return card
