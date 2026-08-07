"""Growth / pet endpoints (R3, R4, R5, R6)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.schemas import Commitment, GrowthView, JobRef, PetState
from app.schemas.common import ErrorEnvelope
from app.services import imagegen

router = APIRouter(prefix="/students", tags=["growth"])


def _student_not_found(student_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="STUDENT_NOT_FOUND",
            message="学生不存在",
            details={"student_id": student_id},
        ).model_dump(),
    )


def _forbidden(student_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=ErrorEnvelope(
            code="FORBIDDEN",
            message="无权访问该学生档案",
            details={"student_id": student_id},
        ).model_dump(),
    )


def _assert_access(conn: sqlite3.Connection, user: CurrentUser, student_id: str) -> None:
    row = conn.execute(
        "SELECT class_code FROM students WHERE student_id = ?", (student_id,)
    ).fetchone()
    if row is None:
        raise _student_not_found(student_id)
    if user.user_type == "student" and user.user_id == student_id:
        return
    if user.user_type == "teacher" and row["class_code"] == user.class_code:
        return
    raise _forbidden(student_id)


def _parse_json(value: str | None) -> list[dict[str, Any]]:
    if not value:
        return []
    try:
        data = json.loads(value)
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def _parse_dt(value: str | None) -> datetime:
    if value:
        return datetime.fromisoformat(value)
    return datetime.now(timezone.utc)


def _build_pet_state(row: sqlite3.Row) -> PetState:
    return PetState(
        species=row["species"] or "cat",
        stage=row["pet_stage"] or 0,
        state=row["state"],
        growth_value=row["growth_value"] or 0,
        last_growth_at=_parse_dt(row["last_growth_at"]),
        cheer_until=_parse_dt(row["cheer_until"]) if row["cheer_until"] else None,
        needs_care=bool(row["needs_care"]),
        portrait_url=row["portrait_url"],
        updated_at=_parse_dt(row["last_growth_at"]),
    )


def _build_commitments(row: sqlite3.Row) -> list[Commitment]:
    items: list[Commitment] = []
    for item in _parse_json(row["commitments"]):
        if isinstance(item, dict) and "id" in item and "text" in item:
            items.append(
                Commitment(
                    id=str(item["id"]),
                    text=str(item["text"]),
                    created_at=_parse_dt(item.get("created_at")),
                    status=item.get("status", "active"),
                )
            )
    return items


@router.get("/{student_id}/growth", response_model=GrowthView)
def get_growth(
    student_id: str,
    view: str = "light",
    user: CurrentUser = Depends(get_current_user),
) -> GrowthView:
    conn = get_db_connection()
    try:
        _assert_access(conn, user, student_id)
        row = conn.execute(
            "SELECT * FROM growth_records WHERE student_id = ?", (student_id,)
        ).fetchone()
        if row is None:
            raise _student_not_found(student_id)

        actions = None
        history = None
        if view == "full":
            actions = _parse_json(row["actions"])
            history = _parse_json(row["history"])

        return GrowthView(
            ideal=row["ideal"],
            commitments=_build_commitments(row),
            last_gist=row["last_gist"],
            growth_value=row["growth_value"] or 0,
            stage=row["stage"] or "egg",
            pet=_build_pet_state(row),
            actions=actions,
            history=history,
        )
    finally:
        conn.close()


@router.get("/{student_id}/pet", response_model=PetState)
def get_pet(student_id: str, user: CurrentUser = Depends(get_current_user)) -> PetState:
    conn = get_db_connection()
    try:
        _assert_access(conn, user, student_id)
        row = conn.execute(
            "SELECT * FROM growth_records WHERE student_id = ?", (student_id,)
        ).fetchone()
        if row is None:
            raise _student_not_found(student_id)
        return _build_pet_state(row)
    finally:
        conn.close()


@router.post("/{student_id}/pet/portrait", response_model=JobRef)
def create_portrait(
    student_id: str,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    user: CurrentUser = Depends(get_current_user),
) -> JobRef:
    conn = get_db_connection()
    try:
        _assert_access(conn, user, student_id)
        row = conn.execute(
            "SELECT * FROM growth_records WHERE student_id = ?", (student_id,)
        ).fetchone()
        if row is None:
            raise _student_not_found(student_id)

        job_id = f"portrait-{student_id}"
        if idempotency_key:
            existing = conn.execute(
                "SELECT job_id FROM jobs WHERE idempotency_key = ? AND student_id = ?",
                (idempotency_key, student_id),
            ).fetchone()
            if existing is not None:
                return JobRef(job_id=existing["job_id"])
            job_id = f"portrait-{student_id}-{idempotency_key[:16]}"

        now = datetime.now(timezone.utc).isoformat()
        result_url = f"/api/static/portraits/{student_id}.png"

        # 生成画像文件（placeholder 落盘 / dashscope 真实文生图），并回写 DB
        out_path = imagegen.portraits_dir() / f"{student_id}.png"
        prompt = imagegen.build_prompt(
            {"ideal": row["ideal"], "species": row["species"]}
        )
        imagegen.generate_portrait(
            prompt, out_path, seed=abs(hash(student_id)) % 4
        )

        conn.execute(
            """
            INSERT OR REPLACE INTO jobs (
                job_id, student_id, job_type, status,
                result_url, idempotency_key, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (job_id, student_id, "portrait", "done", result_url, idempotency_key, now, now),
        )
        conn.execute(
            "UPDATE growth_records SET portrait_url = ? WHERE student_id = ?",
            (result_url, student_id),
        )
        conn.commit()
        return JobRef(job_id=job_id)
    finally:
        conn.close()
