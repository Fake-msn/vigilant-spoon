"""Class / student list endpoints (R1, R17)."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import REGION_NAMES
from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.schemas import ClassInfo, ClassPetView, PetState, StudentProfile
from app.schemas.common import ErrorEnvelope

router = APIRouter(prefix="/classes", tags=["classes"])


def _class_not_found(class_code: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="CLASS_NOT_FOUND",
            message="班级码不存在",
            details={"class_code": class_code},
        ).model_dump(),
    )


def _parse_dt(value: str | None) -> datetime:
    if value:
        return datetime.fromisoformat(value)
    from datetime import timezone

    return datetime.now(timezone.utc)


@router.get("/{class_code}", response_model=ClassInfo)
def get_class(class_code: str) -> ClassInfo:
    conn = get_db_connection()
    try:
        class_row = conn.execute(
            "SELECT class_code, class_name, school, region_key, grade, class_no "
            "FROM classes WHERE class_code = ?",
            (class_code,),
        ).fetchone()
        if class_row is None:
            raise _class_not_found(class_code)

        student_rows = conn.execute(
            "SELECT student_id, name, student_no, grade, avatar_seed, role, ideal "
            "FROM students WHERE class_code = ? ORDER BY student_no",
            (class_code,),
        ).fetchall()

        region_name = REGION_NAMES.get(class_row["region_key"], class_row["region_key"])
        students = [
            StudentProfile(
                id=row["student_id"],
                name=row["name"],
                student_no=row["student_no"],
                class_code=class_row["class_code"],
                avatar_seed=row["avatar_seed"],
                role=row["role"],
                grade=row["grade"],
                region_key=class_row["region_key"],
                region_name=region_name,
                ideal=row["ideal"],
            )
            for row in student_rows
        ]

        return ClassInfo(
            class_code=class_row["class_code"],
            class_name=class_row["class_name"],
            school=class_row["school"],
            region_key=class_row["region_key"],
            region_name=region_name,
            grade=class_row["grade"],
            class_no=class_row["class_no"],
            students=students,
        )
    finally:
        conn.close()


@router.get("/{class_code}/pets", response_model=list[ClassPetView])
def list_class_pets(
    class_code: str, user: CurrentUser = Depends(get_current_user)
) -> list[ClassPetView]:
    if user.class_code != class_code:
        raise _class_not_found(class_code)

    conn = get_db_connection()
    try:
        cls = conn.execute(
            "SELECT class_code FROM classes WHERE class_code = ?", (class_code,)
        ).fetchone()
        if cls is None:
            raise _class_not_found(class_code)

        rows = conn.execute(
            """
            SELECT s.student_id, s.name, s.avatar_seed,
                   g.state, g.growth_value, g.species, g.pet_stage,
                   g.last_growth_at, g.cheer_until, g.needs_care, g.portrait_url
            FROM students s
            LEFT JOIN growth_records g ON s.student_id = g.student_id
            WHERE s.class_code = ?
            ORDER BY s.student_no
            """,
            (class_code,),
        ).fetchall()

        views: list[ClassPetView] = []
        for row in rows:
            pet = PetState(
                species=row["species"] or "cat",
                stage=row["pet_stage"] or 0,
                state=row["state"] or "daily",
                growth_value=row["growth_value"] or 0,
                last_growth_at=_parse_dt(row["last_growth_at"]),
                cheer_until=_parse_dt(row["cheer_until"]) if row["cheer_until"] else None,
                needs_care=bool(row["needs_care"]),
                portrait_url=row["portrait_url"],
                updated_at=_parse_dt(row["last_growth_at"]),
            )
            views.append(
                ClassPetView(
                    student_id=row["student_id"],
                    name=row["name"],
                    avatar_seed=row["avatar_seed"],
                    pet=pet,
                )
            )

        # gray state first, then by student_id
        views.sort(key=lambda v: (0 if v.pet.state == "gray" else 1, v.student_id))
        return views
    finally:
        conn.close()
