"""Pet state machine (zero LLM).

The pet has three visible states:
- daily: normal state.
- gray: no growth value increase for 7 days; sets needs_care=True.
- cheer: positive speech signal within a 72h window.

All transitions are deterministic pure functions.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

PetStateLiteral = Literal["daily", "gray", "cheer"]


def species_for_ideal(ideal: str | None) -> str:
    """Map a student's ideal career to a pet species family."""
    mapping = {
        "蛋糕师": "baker",
        "军人": "soldier",
        "科学家": "scientist",
        "教师": "teacher",
        "医生": "doctor",
    }
    return mapping.get(ideal or "", "cat")


def pet_stage_for(growth_value: int) -> int:
    """Derive pet evolution stage from total growth value."""
    if growth_value >= 100:
        return 3
    if growth_value >= 50:
        return 2
    if growth_value >= 20:
        return 1
    return 0


def stage_label_for(growth_value: int) -> str:
    """Human-readable growth stage label."""
    if growth_value >= 100:
        return "bloom"
    if growth_value >= 50:
        return "bud"
    if growth_value >= 20:
        return "sprout"
    return "egg"


def transition(
    state: PetStateLiteral,
    growth_value: int,
    last_growth_at: datetime,
    cheer_until: datetime | None,
    now: datetime,
    growth_delta: int = 0,
    positive_signal: bool = False,
) -> tuple[PetStateLiteral, int, datetime, datetime | None, bool]:
    """Return the new (state, growth_value, last_growth_at, cheer_until, needs_care).

    Rules (in precedence order):
    1. A positive speech signal forces cheer for 72 hours.
    2. No growth for 7 days forces gray and needs_care.
    3. An unexpired cheer window keeps cheer.
    4. Otherwise daily.
    """
    new_growth = max(0, growth_value + growth_delta)
    new_last_growth_at = now if growth_delta > 0 else last_growth_at

    if positive_signal:
        return (
            "cheer",
            new_growth,
            new_last_growth_at,
            now + timedelta(hours=72),
            False,
        )

    if now - new_last_growth_at > timedelta(days=7):
        return (
            "gray",
            new_growth,
            new_last_growth_at,
            None,
            True,
        )

    if state == "cheer" and cheer_until is not None and now < cheer_until:
        return (
            "cheer",
            new_growth,
            new_last_growth_at,
            cheer_until,
            False,
        )

    return (
        "daily",
        new_growth,
        new_last_growth_at,
        None,
        False,
    )


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
