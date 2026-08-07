"""信件模板引擎（F4-01）：纯模板填槽，无 LLM 依赖。

对 gray/needs_care 学生必含关怀段；对正常学生突出最近一次成长线索。
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class LetterContext:
    """生成一封信所需的最小上下文。"""

    student_id: str
    student_name: str
    grade: str
    class_name: str
    school: str
    region_name: str
    ideal: str | None
    last_gist: str | None
    state: str
    needs_care: bool
    signal: str | None
    commitments: list[dict[str, object]]
    history: list[dict[str, object]]


@dataclass(frozen=True)
class GeneratedLetter:
    """生成结果。"""

    title: str
    preview: str
    body: list[str]
    source: str = "template"


def _pick_last_topic(history: list[dict[str, object]]) -> str | None:
    if not history:
        return None
    for item in reversed(history):
        topic = item.get("topic")
        if isinstance(topic, str) and topic:
            return topic
    return None


def _format_commitments(commitments: list[dict[str, object]]) -> str:
    active = [
        str(c.get("text", ""))
        for c in commitments
        if c.get("status") == "active" and c.get("text")
    ]
    if not active:
        return "这周还没有未完成的承诺，要不要和小信一起定一个？"
    if len(active) == 1:
        return f"你还有一个承诺没有完成：{active[0]}。"
    return "你还有几个承诺没有完成：" + "、".join(active) + "。"


def _care_paragraph(ctx: LetterContext) -> list[str]:
    """为需要关怀的学生生成专属段落。"""
    lines: list[str] = []
    if ctx.signal:
        lines.append(f"老师告诉我，{ctx.signal}")
    else:
        lines.append("最近小信觉得你有点安静，老师和我都很想你。")
    lines.append(
        "不管你遇到了什么，都可以慢慢来。重要的是，你并不孤单，" "老师和小信都会陪着你。"
    )
    return lines


def generate_letter(ctx: LetterContext) -> GeneratedLetter:
    """基于成长档案生成一封周来信。"""
    topic = _pick_last_topic(ctx.history)
    commitment_line = _format_commitments(ctx.commitments)

    # 称呼
    body: list[str] = [
        f"致{ctx.school}{ctx.grade}的{ctx.student_name}同学：",
    ]

    # 开场：理想与最近一次谈心
    if ctx.ideal:
        body.append(f"我一直记得你的梦想是成为一名{ctx.ideal}。")
    else:
        body.append("我一直记得你说过，对未来有很多好奇和期待。")

    if ctx.last_gist:
        body.append(f"上次我们聊到：{ctx.last_gist}。")
    elif topic:
        body.append(f"最近我们聊到「{topic}」，我很开心你愿意和我分享。")
    else:
        body.append("最近很想听听你的故事，什么时候再来和小信聊聊呢？")

    # 承诺提醒
    body.append(commitment_line)

    # 关怀段（gray/needs_care 必含）
    if ctx.state == "gray" or ctx.needs_care:
        body.extend(_care_paragraph(ctx))

    # 结尾鼓励
    if ctx.ideal:
        body.append(
            f"梦想不怕小，只要一点点靠近。下周我想听听你为{ctx.ideal}做了哪些小事。"
        )
    else:
        body.append("慢慢想，不着急，小信会一直在这里陪你发现喜欢的事。")

    body.append("期待下周听到你的新故事。")
    body.append("——小信")

    # 标题与预览
    if ctx.ideal:
        title = f"致{ctx.student_name}的第 {len(ctx.history) + 1} 封信"
    else:
        title = f"致{ctx.student_name}的第 {len(ctx.history) + 1} 封信"
    preview = body[1] if len(body) > 1 else body[0]
    if len(preview) > 60:
        preview = preview[:57] + "…"

    return GeneratedLetter(title=title, preview=preview, body=body)


def load_letter_context(conn: sqlite3.Connection, student_id: str) -> LetterContext:
    """从数据库加载生成一封信所需的上下文。"""
    student_row = conn.execute(
        """
        SELECT s.student_id, s.name, s.grade, s.ideal,
               c.class_name, c.school, c.region_key
        FROM students s
        JOIN classes c ON s.class_code = c.class_code
        WHERE s.student_id = ?
        """,
        (student_id,),
    ).fetchone()
    if student_row is None:
        raise ValueError(f"学生不存在: {student_id}")

    growth_row = conn.execute(
        "SELECT ideal, last_gist, state, needs_care, signal, commitments, history "
        "FROM growth_records WHERE student_id = ?",
        (student_id,),
    ).fetchone()

    def _parse_json(value: str | None) -> list[dict[str, object]]:
        if not value:
            return []
        try:
            data = json.loads(value)
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []

    from app.constants import REGION_NAMES

    region_key = student_row["region_key"]
    region_name = REGION_NAMES.get(region_key, region_key)

    ideal: str | None = student_row["ideal"]
    if growth_row is not None and growth_row["ideal"]:
        ideal = growth_row["ideal"]

    return LetterContext(
        student_id=student_id,
        student_name=student_row["name"],
        grade=student_row["grade"],
        class_name=student_row["class_name"],
        school=student_row["school"],
        region_name=region_name,
        ideal=ideal,
        last_gist=growth_row["last_gist"] if growth_row else None,
        state=growth_row["state"] if growth_row else "daily",
        needs_care=bool(growth_row["needs_care"]) if growth_row else False,
        signal=growth_row["signal"] if growth_row else None,
        commitments=_parse_json(growth_row["commitments"]) if growth_row else [],
        history=_parse_json(growth_row["history"]) if growth_row else [],
    )


def render_letter_for_student(
    conn: sqlite3.Connection,
    student_id: str,
    now: datetime | None = None,
) -> GeneratedLetter:
    """对外统一入口：加载上下文并生成信件。"""
    ctx = load_letter_context(conn, student_id)
    return generate_letter(ctx)
