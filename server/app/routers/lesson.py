"""Lesson planning endpoints (R9, R10, R16)."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.schemas import (
    LessonGenReq,
    LessonMaterial,
    LessonPlan,
    LessonSummary,
    TraceCreate,
)
from app.schemas.common import ErrorEnvelope
from app.services.llm import chat_completion

router = APIRouter(tags=["lessons"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _class_not_found(class_code: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="CLASS_NOT_FOUND",
            message="班级码不存在",
            details={"class_code": class_code},
        ).model_dump(),
    )


def _lesson_not_found(lesson_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="LESSON_NOT_FOUND",
            message="课程不存在",
            details={"lesson_id": lesson_id},
        ).model_dump(),
    )


def _parse_json(value: str | None) -> Any:
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return None


def _build_plan(row: sqlite3.Row) -> LessonPlan:
    goals = _parse_json(row["goals"])
    if not isinstance(goals, list):
        goals = [row["goal"]] if row["goal"] else []
    materials_raw = _parse_json(row["materials"])
    materials: list[LessonMaterial] = []
    if isinstance(materials_raw, list):
        for item in materials_raw:
            if isinstance(item, dict) and "title" in item and "content" in item:
                materials.append(
                    LessonMaterial(title=str(item["title"]), content=str(item["content"]))
                )
    created_at = row["created_at"]
    return LessonPlan(
        lesson_id=row["course_id"],
        topic=row["topic"],
        goals=goals,
        guidance_strategy=row["guidance_strategy"] or "",
        materials=materials,
        created_at=datetime.fromisoformat(created_at) if created_at else _now(),
    )


def _build_summary(row: sqlite3.Row) -> LessonSummary:
    traces = _parse_json(row["traces"])
    return LessonSummary(
        lesson_id=row["course_id"],
        topic=row["topic"],
        date=row["date"],
        duration=row["duration"],
        joined=row["joined"],
        avg_score=None,
        status=row["status"],
        goal=row["goal"],
        traces=traces if isinstance(traces, list) else [],
    )


def _template_materials(req: LessonGenReq) -> list[LessonMaterial]:
    materials: list[LessonMaterial] = [
        LessonMaterial(
            title="开场素材",
            content=f"围绕「{req.topic}」创设语境，引导学生说出具体理想。",
        )
    ]
    if req.guidance:
        materials.append(LessonMaterial(title="引导策略", content=req.guidance))
    for goal in req.goals:
        materials.append(LessonMaterial(title="教学目标", content=goal))
    return materials


def _llm_materials(req: LessonGenReq) -> list[LessonMaterial] | None:
    """尝试用 LLM 生成备课素材；未配置 / 解析失败时返回 None 以回退模板。"""
    goals_text = "；".join(req.goals) if req.goals else "（未指定）"
    system = (
        "你是「小信」的备课助手。根据课程主题与教学目标生成一份教案素材，"
        "只输出 JSON，不要输出任何额外文字。格式："
        '{"materials": [{"title": "素材标题", "content": "素材内容"}, ...]}'
        "其中应包含开场素材、引导策略、教学目标等 3-5 条素材。"
    )
    user = (
        f"课程主题：{req.topic}\n"
        f"教学目标：{goals_text}\n"
        f"引导策略：{req.guidance or '（未指定）'}"
    )
    text = chat_completion(system, user, max_tokens=900)
    if not text:
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    items = data.get("materials", [])
    materials = [
        LessonMaterial(
            title=str(m.get("title", "")).strip(),
            content=str(m.get("content", "")).strip(),
        )
        for m in items
        if isinstance(m, dict) and m.get("title") and m.get("content")
    ]
    return materials or None


@router.post("/lesson/generate", response_model=LessonPlan)
def generate_lesson(
    req: LessonGenReq, user: CurrentUser = Depends(get_current_user)
) -> LessonPlan:
    """R9：生成备课方案并落库。"""
    lesson_id = f"les-{uuid.uuid4().hex[:12]}"
    now = _now()
    date_str = now.strftime("%m-%d")

    # 演示期默认时长与痕迹
    duration = "40 分钟"
    traces = ["课程已创建，等待课堂开启"]

    materials = _llm_materials(req)
    if materials is None:
        materials = _template_materials(req)

    primary_goal = req.goals[0] if req.goals else req.topic

    conn = get_db_connection()
    try:
        conn.execute(
            """
            INSERT INTO courses (
                course_id, class_code, topic, date,
                duration, joined, status, goal, traces,
                goals, guidance_strategy, materials, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                lesson_id,
                user.class_code,
                req.topic,
                date_str,
                duration,
                0,
                "active",
                primary_goal,
                json.dumps(traces, ensure_ascii=False),
                json.dumps(req.goals, ensure_ascii=False),
                req.guidance or "",
                json.dumps([m.model_dump() for m in materials], ensure_ascii=False),
                now.isoformat(),
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return LessonPlan(
        lesson_id=lesson_id,
        topic=req.topic,
        goals=req.goals,
        guidance_strategy=req.guidance or "",
        materials=materials,
        created_at=now,
    )


@router.get("/lessons/{lesson_id}", response_model=LessonPlan)
def get_lesson(
    lesson_id: str, user: CurrentUser = Depends(get_current_user)
) -> LessonPlan:
    """R10：查询备课方案详情。"""
    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT * FROM courses WHERE course_id = ?", (lesson_id,)
        ).fetchone()
        if row is None or row["class_code"] != user.class_code:
            raise _lesson_not_found(lesson_id)
        return _build_plan(row)
    finally:
        conn.close()


@router.get("/classes/{class_code}/lessons", response_model=list[LessonSummary])
def list_lessons(
    class_code: str, user: CurrentUser = Depends(get_current_user)
) -> list[LessonSummary]:
    """R16：按日期倒序列出班级课程。"""
    if user.class_code != class_code:
        raise _class_not_found(class_code)

    conn = get_db_connection()
    try:
        rows = conn.execute(
            """
            SELECT * FROM courses
            WHERE class_code = ?
            ORDER BY date DESC, created_at DESC
            """,
            (class_code,),
        ).fetchall()
        return [_build_summary(row) for row in rows]
    finally:
        conn.close()


@router.post("/lessons/{lesson_id}/traces", response_model=LessonSummary)
def add_lesson_trace(
    lesson_id: str,
    req: TraceCreate,
    user: CurrentUser = Depends(get_current_user),
) -> LessonSummary:
    """教师为课程追加一条课堂留痕评语，供日后回顾。"""
    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT * FROM courses WHERE course_id = ?", (lesson_id,)
        ).fetchone()
        if row is None or row["class_code"] != user.class_code:
            raise _lesson_not_found(lesson_id)

        traces = _parse_json(row["traces"])
        if not isinstance(traces, list):
            traces = []
        traces.append(req.content.strip())

        conn.execute(
            "UPDATE courses SET traces = ? WHERE course_id = ?",
            (json.dumps(traces, ensure_ascii=False), lesson_id),
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM courses WHERE course_id = ?", (lesson_id,)
        ).fetchone()
        return _build_summary(row)
    finally:
        conn.close()
