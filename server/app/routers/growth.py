"""Growth / pet endpoints (R3, R4, R5, R6)."""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, status

from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.schemas import Commitment, CommitmentsPatch, GrowthView, JobRef, PetState
from app.schemas.common import ErrorEnvelope
from app.services import imagegen
from app.services.pet import species_for_ideal

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


def _ensure_growth_record(conn: sqlite3.Connection, student_id: str) -> None:
    """安全网：如果学生存在但 growth_records 缺失，自动初始化一条默认记录。

    防止历史数据或其他建班路径遗漏插入 growth_records 导致"学生不存在"错误。
    """
    existing = conn.execute(
        "SELECT 1 FROM growth_records WHERE student_id = ?", (student_id,)
    ).fetchone()
    if existing is not None:
        return
    stu = conn.execute(
        "SELECT ideal FROM students WHERE student_id = ?", (student_id,)
    ).fetchone()
    if stu is None:
        return
    species = species_for_ideal(stu["ideal"])
    conn.execute(
        """
        INSERT INTO growth_records (
            student_id, ideal, commitments, actions, history, stage,
            pet_state, last_gist, needs_care, teacher_constraints,
            state, signal, growth_value, species, pet_stage,
            last_growth_at, cheer_until, portrait_url,
            points_total, level, hunger, mood, last_points_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            student_id,
            stu["ideal"],
            json.dumps([], ensure_ascii=False),
            json.dumps([], ensure_ascii=False),
            json.dumps([], ensure_ascii=False),
            "egg",
            None,
            None,
            0,
            None,
            "daily",
            None,
            0,
            species,
            0,
            None,
            None,
            None,
            0,
            1,
            50,
            60,
            None,
        ),
    )
    conn.commit()


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
        points_total=row["points_total"] or 0,
        level=row["level"] or 1,
        hunger=row["hunger"] or 50,
        mood=row["mood"] or 60,
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
        _ensure_growth_record(conn, student_id)
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


def _teacher_only(user: CurrentUser) -> None:
    """仅允许教师操作承诺内容；学生越权写会被 403 拦截。"""
    if user.user_type != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorEnvelope(
                code="TEACHER_ONLY",
                message="仅教师可编辑承诺内容与完成状态",
            ).model_dump(),
        )


@router.patch("/{student_id}/commitments", response_model=list[Commitment])
def update_commitments(
    student_id: str,
    payload: CommitmentsPatch,
    user: CurrentUser = Depends(get_current_user),
) -> list[Commitment]:
    """教师端：全量更新某学生的承诺列表（含新增/编辑/删除/状态切换）。"""
    conn = get_db_connection()
    try:
        _assert_access(conn, user, student_id)
        _teacher_only(user)

        # 规范化：去空文本、空created_at取当前时间、去重id（同名覆盖取最后）
        normalized: list[Commitment] = []
        seen_ids: set[str] = set()
        now = datetime.now(timezone.utc)
        for c in payload.commitments:
            if not c.text.strip():
                continue
            if c.id in seen_ids:
                continue
            seen_ids.add(c.id)
            normalized.append(
                Commitment(
                    id=c.id,
                    text=c.text.strip(),
                    created_at=c.created_at or now,
                    status=c.status,
                )
            )

        serialized = json.dumps(
            [
                {
                    "id": c.id,
                    "text": c.text,
                    "created_at": c.created_at.isoformat(),
                    "status": c.status,
                }
                for c in normalized
            ],
            ensure_ascii=False,
        )

        conn.execute(
            "SELECT 1 FROM growth_records WHERE student_id = ?", (student_id,)
        ).fetchone()
        row = conn.execute(
            "SELECT ideal, commitments FROM growth_records WHERE student_id = ?",
            (student_id,),
        ).fetchone()
        if row is None:
            raise _student_not_found(student_id)

        # 状态变化 +1 成长值（给学生鼓励小惊喜）
        old_list = _parse_json(row["commitments"])
        old_status: dict[str, str] = {}
        for item in old_list:
            if isinstance(item, dict) and item.get("id"):
                old_status[str(item["id"])] = str(item.get("status", "active"))
        extra_growth = 0
        for nc in normalized:
            prev = old_status.get(nc.id, "active")
            if prev != "fulfilled" and nc.status == "fulfilled":
                extra_growth += 1

        conn.execute(
            "UPDATE growth_records SET commitments = ?, "
            "growth_value = growth_value + ?, last_growth_at = ? "
            "WHERE student_id = ?",
            (
                serialized,
                extra_growth,
                datetime.now(timezone.utc).isoformat(),
                student_id,
            ),
        )
        conn.commit()
        return normalized
    finally:
        conn.close()


@router.get("/{student_id}/pet", response_model=PetState)
def get_pet(student_id: str, user: CurrentUser = Depends(get_current_user)) -> PetState:
    conn = get_db_connection()
    try:
        _assert_access(conn, user, student_id)
        _ensure_growth_record(conn, student_id)
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


# ---------- 学生自定义头像上传 ----------

_AVATAR_DIR = imagegen.static_dir() / "avatars"
_AVATAR_DIR.mkdir(parents=True, exist_ok=True)
_ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/jpg"}
_ALLOWED_AVATAR_EXTS = {".jpg", ".jpeg", ".png"}
_MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2MB


@router.post("/{student_id}/avatar")
async def upload_avatar(
    student_id: str,
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
) -> dict[str, str]:
    """上传学生自定义头像（支持 jpg/png/jpeg，限 2MB）。"""
    # 权限校验
    conn = get_db_connection()
    try:
        _assert_access(conn, user, student_id)
    finally:
        conn.close()

    # 校验文件类型
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in _ALLOWED_AVATAR_EXTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ErrorEnvelope(
                code="INVALID_FILE_TYPE",
                message="仅支持 JPG、PNG、JPEG 格式",
            ).model_dump(),
        )

    # 读取并校验文件大小
    content = await file.read()
    if len(content) > _MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=ErrorEnvelope(
                code="FILE_TOO_LARGE",
                message="头像文件不能超过 2MB",
            ).model_dump(),
        )

    # 保存文件
    file_path = _AVATAR_DIR / f"{student_id}{ext}"
    file_path.write_bytes(content)

    # 更新数据库
    avatar_url = f"/api/static/avatars/{student_id}{ext}"
    conn = get_db_connection()
    try:
        conn.execute(
            "UPDATE students SET custom_avatar_url = ? WHERE student_id = ?",
            (avatar_url, student_id),
        )
        conn.commit()
    finally:
        conn.close()

    return {"avatar_url": avatar_url}
