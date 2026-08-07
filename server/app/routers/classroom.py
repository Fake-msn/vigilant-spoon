"""Classroom control endpoints (R11, R12, R13)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, status

from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.schemas import ClassroomStatus, ControlReq
from app.schemas.common import ErrorEnvelope

router = APIRouter(prefix="/classes", tags=["classroom"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _session_id(class_code: str) -> str:
    return f"cls-{class_code}"


def _class_not_found(class_code: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="CLASS_NOT_FOUND",
            message="班级码不存在",
            details={"class_code": class_code},
        ).model_dump(),
    )


def _illegal_state(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=ErrorEnvelope(
            code="ILLEGAL_STATE",
            message=message,
        ).model_dump(),
    )


def _get_class_students(conn: sqlite3.Connection, class_code: str) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT student_id, name FROM students WHERE class_code = ? ORDER BY student_id",
        (class_code,),
    ).fetchall()
    return [dict(row) for row in rows]


def _build_status(row: sqlite3.Row) -> ClassroomStatus:
    return ClassroomStatus(
        session_id=row["session_id"],
        state=row["state"],
        current_student=row["current_student"],
        current_slot=row["current_slot"],
        turn_count=row["turn_count"],
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def _idle_status(class_code: str) -> ClassroomStatus:
    return ClassroomStatus(
        session_id=_session_id(class_code),
        state="idle",
        current_student=None,
        current_slot=None,
        turn_count=0,
        updated_at=_now(),
    )


def _load_cmds(row: sqlite3.Row) -> list[str]:
    raw = row["processed_cmds"]
    try:
        return cast(list[str], json.loads(raw)) if raw else []
    except json.JSONDecodeError:
        return []


def _next_student(students: list[dict[str, Any]], current: str | None) -> str | None:
    if not students:
        return None
    if current is None:
        return str(students[0]["student_id"])
    ids = [str(s["student_id"]) for s in students]
    try:
        idx = ids.index(current)
    except ValueError:
        return ids[0]
    return ids[(idx + 1) % len(ids)]


@router.post("/{class_code}/session/start", response_model=ClassroomStatus)
def start_session(
    class_code: str, user: CurrentUser = Depends(get_current_user)
) -> ClassroomStatus:
    if user.class_code != class_code:
        raise _class_not_found(class_code)

    conn = get_db_connection()
    try:
        cls = conn.execute(
            "SELECT class_code FROM classes WHERE class_code = ?", (class_code,)
        ).fetchone()
        if cls is None:
            raise _class_not_found(class_code)

        session_id = _session_id(class_code)
        row = conn.execute(
            "SELECT * FROM classroom_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()

        if row is not None and row["state"] != "idle" and row["ended_at"] is None:
            return _build_status(row)

        now = _now()
        students = _get_class_students(conn, class_code)
        first = students[0]["student_id"] if students else None

        conn.execute(
            "INSERT OR REPLACE INTO classroom_sessions "
            "(session_id, class_code, state, current_student, current_slot, "
            "turn_count, started_at, updated_at, ended_at, processed_cmds) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (session_id, class_code, "active", first, None, 1, now, now, None, "[]"),
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM classroom_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        return _build_status(row)
    finally:
        conn.close()


@router.post("/{class_code}/session/control", response_model=ClassroomStatus)
def control_session(
    class_code: str,
    req: ControlReq,
    user: CurrentUser = Depends(get_current_user),
) -> ClassroomStatus:
    if user.class_code != class_code:
        raise _class_not_found(class_code)

    conn = get_db_connection()
    try:
        cls = conn.execute(
            "SELECT class_code FROM classes WHERE class_code = ?", (class_code,)
        ).fetchone()
        if cls is None:
            raise _class_not_found(class_code)

        session_id = _session_id(class_code)
        row = conn.execute(
            "SELECT * FROM classroom_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        if row is None:
            raise _illegal_state("课堂尚未开始")

        cmds = _load_cmds(row)
        if req.client_cmd_id in cmds:
            return _build_status(row)

        state = row["state"]
        now = _now()
        current_student = row["current_student"]
        current_slot = row["current_slot"]
        turn_count = row["turn_count"]

        if req.action == "pause":
            if state != "active":
                raise _illegal_state("只能在上课中暂停")
            state = "paused"
        elif req.action == "resume":
            if state != "paused":
                raise _illegal_state("只能继续已暂停的课堂")
            state = "active"
        elif req.action == "next_student":
            if state != "active":
                raise _illegal_state("只能在上课中切换学生")
            students = _get_class_students(conn, class_code)
            current_student = _next_student(students, current_student)
            turn_count += 1
        elif req.action == "select_student":
            if state != "active":
                raise _illegal_state("只能在上课中手动选择学生")
            target = (req.payload or {}).get("student_id")
            if not isinstance(target, str) or not target:
                raise _illegal_state("缺少要选择的学生 ID")
            students = _get_class_students(conn, class_code)
            ids = [str(s["student_id"]) for s in students]
            if target not in ids:
                raise _illegal_state("目标学生不在当前班级")
            current_student = target
            turn_count += 1
        elif req.action == "switch_content":
            if state != "active":
                raise _illegal_state("只能在上课中切换内容")
            slot = req.payload.get("slot") if req.payload else None
            current_slot = slot if isinstance(slot, str) else None
        else:
            raise _illegal_state(f"未知动作: {req.action}")

        cmds.append(req.client_cmd_id)
        conn.execute(
            "UPDATE classroom_sessions SET state = ?, current_student = ?, "
            "current_slot = ?, turn_count = ?, updated_at = ?, processed_cmds = ? "
            "WHERE session_id = ?",
            (
                state,
                current_student,
                current_slot,
                turn_count,
                now.isoformat(),
                json.dumps(cmds[-100:]),
                session_id,
            ),
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM classroom_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        return _build_status(row)
    finally:
        conn.close()


@router.get("/{class_code}/session/status", response_model=ClassroomStatus)
def get_session_status(
    class_code: str, user: CurrentUser = Depends(get_current_user)
) -> ClassroomStatus:
    if user.class_code != class_code:
        raise _class_not_found(class_code)

    conn = get_db_connection()
    try:
        cls = conn.execute(
            "SELECT class_code FROM classes WHERE class_code = ?", (class_code,)
        ).fetchone()
        if cls is None:
            raise _class_not_found(class_code)

        session_id = _session_id(class_code)
        row = conn.execute(
            "SELECT * FROM classroom_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        if row is None:
            return _idle_status(class_code)
        return _build_status(row)
    finally:
        conn.close()
