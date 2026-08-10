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
    """Map a student's ideal career to a pet species family.

    与前端 speciesFromIdeal 保持一致：关键词模糊匹配；
    无匹配时返回 ``sprout``（嫩芽态，代表梦想尚未说出口）。
    """
    text = (ideal or "").strip()
    if not text:
        return "sprout"

    # 精确职业名 → 物种
    exact = {
        "蛋糕师": "baker",
        "烘焙师": "baker",
        "军人": "soldier",
        "解放军": "soldier",
        "士兵": "soldier",
        "科学家": "scientist",
        "天文学家": "scientist",
        "发明家": "scientist",
        "教师": "teacher",
        "老师": "teacher",
        "医生": "doctor",
        "护士": "doctor",
        "画家": "painter",
        "艺术家": "painter",
        "警察": "police",
        "警官": "police",
        "民警": "police",
        "消防员": "firefighter",
        "飞行员": "pilot",
        "机长": "pilot",
        "宇航员": "astronaut",
        "航天员": "astronaut",
        "工程师": "engineer",
        "建筑工程师": "engineer",
        "机械工程师": "engineer",
        "音乐家": "musician",
        "歌手": "musician",
        "钢琴家": "musician",
        "运动员": "athlete",
        "足球运动员": "athlete",
        "篮球运动员": "athlete",
        "作家": "writer",
        "小说家": "writer",
        "诗人": "writer",
        "作者": "writer",
    }
    if text in exact:
        return exact[text]

    # 关键词模糊匹配（顺序敏感：警察/消防等新增职业排在军人之前，避免"警察"被旧规则误匹配为 soldier）
    keyword_rules: list[tuple[str, str]] = [
        ("蛋糕", "baker"),
        ("烘焙", "baker"),
        ("面包", "baker"),
        ("甜点", "baker"),
        ("警察", "police"),
        ("警官", "police"),
        ("民警", "police"),
        ("公安", "police"),
        ("消防", "firefighter"),
        ("灭火", "firefighter"),
        ("飞行员", "pilot"),
        ("机长", "pilot"),
        ("开飞机", "pilot"),
        ("宇航", "astronaut"),
        ("太空", "astronaut"),
        ("航天", "astronaut"),
        ("火箭", "astronaut"),
        ("工程师", "engineer"),
        ("建筑", "engineer"),
        ("修路", "engineer"),
        ("造桥", "engineer"),
        ("机械", "engineer"),
        ("建造", "engineer"),
        ("音乐", "musician"),
        ("歌手", "musician"),
        ("钢琴", "musician"),
        ("小提琴", "musician"),
        ("作曲", "musician"),
        ("唱歌", "musician"),
        ("演奏", "musician"),
        ("运动员", "athlete"),
        ("跑步", "athlete"),
        ("足球", "athlete"),
        ("篮球", "athlete"),
        ("奥运", "athlete"),
        ("冠军", "athlete"),
        ("体育", "athlete"),
        ("作家", "writer"),
        ("写作", "writer"),
        ("作者", "writer"),
        ("小说", "writer"),
        ("诗人", "writer"),
        ("写书", "writer"),
        ("写故事", "writer"),
        ("军人", "soldier"),
        ("解放", "soldier"),
        ("站岗", "soldier"),
        ("保卫", "soldier"),
        ("当兵", "soldier"),
        ("部队", "soldier"),
        ("科学", "scientist"),
        ("天文", "scientist"),
        ("实验", "scientist"),
        ("发明", "scientist"),
        ("研究", "scientist"),
        ("星", "scientist"),
        ("老师", "teacher"),
        ("教师", "teacher"),
        ("教书", "teacher"),
        ("医生", "doctor"),
        ("护士", "doctor"),
        ("治病", "doctor"),
        ("救人", "doctor"),
        ("画家", "painter"),
        ("画画", "painter"),
        ("画画儿", "painter"),
        ("美术", "painter"),
        ("艺术", "painter"),
    ]
    for kw, species in keyword_rules:
        if kw in text:
            return species

    return "sprout"


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


# ---- 班宠积分制度：等级 / 饥饿 / 心情 ----

# 阶梯式等级阈值：达到阈值即升级，越升越难
LEVEL_THRESHOLDS = [0, 30, 70, 120, 180, 250]


def level_for(points_total: int) -> int:
    """根据累计积分推导宠物等级（1 起）。"""
    level = 1
    for threshold in LEVEL_THRESHOLDS[1:]:
        if points_total >= threshold:
            level += 1
        else:
            break
    return level


def apply_points(hunger: int, mood: int, points: int) -> tuple[int, int]:
    """加减分后更新饥饿/心情。加分喂食（饥饿↓心情↑），扣分相反。"""
    delta = max(-10, min(10, points))
    new_hunger = max(0, min(100, hunger - delta))
    new_mood = max(0, min(100, mood + delta))
    return new_hunger, new_mood


def decay(
    hunger: int,
    mood: int,
    last_points_at: datetime | None,
    now: datetime,
    days_of_neglect: int | None = None,
) -> tuple[int, int]:
    """长期无积分时饥饿↑心情↓（每缺一天 ±2）。"""
    if last_points_at is None:
        return hunger, mood
    days = days_of_neglect if days_of_neglect is not None else max(0, (now - last_points_at).days)
    if days <= 0:
        return hunger, mood
    new_hunger = max(0, min(100, hunger + days * 2))
    new_mood = max(0, min(100, mood - days * 2))
    return new_hunger, new_mood
