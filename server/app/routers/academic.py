"""Academic records endpoints (R14, R15)."""

from __future__ import annotations

import csv
import io
import json
import sqlite3
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status

from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.schemas import AcademicRecord, AcademicRecordInput, AcademicSummary, SubjectScore
from app.schemas.common import ErrorEnvelope

router = APIRouter(prefix="/classes", tags=["academic"])


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


def _validation_error(
    message: str, details: dict[str, Any] | None = None
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=ErrorEnvelope(
            code="VALIDATION_ERROR",
            message=message,
            details=details or {},
        ).model_dump(),
    )


_ROLE_MAP: dict[str, str] = {
    "普通成员": "member",
    "member": "member",
    "小组长": "group_leader",
    "group_leader": "group_leader",
    "班委": "class_committee",
    "class_committee": "class_committee",
    "课代表": "subject_rep",
    "subject_rep": "subject_rep",
}

_SUBJECTS = {"语文", "数学", "英语"}


def _normalize_role(value: str) -> str | None:
    return _ROLE_MAP.get(value.strip())


def _parse_score(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(float(str(value)))
    except ValueError:
        return None


def _load_class_students(
    conn: sqlite3.Connection, class_code: str
) -> dict[str, tuple[str, str]]:
    """Return student_no -> (student_id, name)."""
    rows = conn.execute(
        "SELECT student_id, name, student_no FROM students WHERE class_code = ?",
        (class_code,),
    ).fetchall()
    return {row["student_no"]: (row["student_id"], row["name"]) for row in rows}


def _validate_input(
    record: AcademicRecordInput,
    students: dict[str, tuple[str, str]],
) -> tuple[str, str] | None:
    if record.student_no not in students:
        return None
    for sc in record.scores:
        if sc.score < 0 or sc.score > 100:
            return None
    return students[record.student_no]


def _insert_record(
    conn: sqlite3.Connection,
    student_id: str,
    scores: list[SubjectScore],
    role: str,
    teacher_note: str,
) -> None:
    now = _now().isoformat()
    conn.execute(
        """
        INSERT INTO academic_records (student_id, scores, role, teacher_note, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            student_id,
            json.dumps([s.model_dump() for s in scores], ensure_ascii=False),
            role,
            teacher_note,
            now,
        ),
    )


def _parse_csv_file(content: bytes) -> list[AcademicRecordInput]:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        return []

    fieldnames = [h.strip() for h in reader.fieldnames]
    if "学号" not in fieldnames:
        raise _validation_error("CSV 缺少「学号」列", {"headers": fieldnames})

    records: list[AcademicRecordInput] = []
    failed_rows: list[int] = []
    for idx, row in enumerate(reader, start=2):
        student_no = str(row.get("学号", "")).strip()
        if not student_no:
            failed_rows.append(idx)
            continue

        scores: list[SubjectScore] = []
        for subject in _SUBJECTS:
            raw = row.get(subject)
            score = _parse_score(raw)
            if score is not None:
                scores.append(SubjectScore(subject=subject, score=score, trend="flat"))

        role_raw = row.get("角色", "")
        role = _normalize_role(role_raw) or "member"
        teacher_note = str(row.get("评语", "")).strip()

        try:
            records.append(
                AcademicRecordInput(
                    student_no=student_no,
                    scores=scores,
                    role=role,  # type: ignore[arg-type]
                    teacher_note=teacher_note,
                )
            )
        except Exception:  # pragma: no cover - schema validation
            failed_rows.append(idx)

    if failed_rows:
        raise _validation_error("部分行解析失败", {"failed_rows": failed_rows})
    return records


def _parse_xlsx_file(content: bytes) -> list[AcademicRecordInput]:
    try:
        import openpyxl
    except ImportError as exc:
        raise _validation_error("服务器未安装 xlsx 解析依赖") from exc

    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    ws = wb.active
    if ws is None:
        raise _validation_error("xlsx 文件无工作表")

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise _validation_error("xlsx 文件为空")

    headers = [str(h).strip() if h is not None else "" for h in rows[0]]
    if "学号" not in headers:
        raise _validation_error("xlsx 缺少「学号」列", {"headers": headers})

    col_index = {h: i for i, h in enumerate(headers)}
    records: list[AcademicRecordInput] = []
    failed_rows: list[int] = []
    for idx, row in enumerate(rows[1:], start=2):
        student_no = str(row[col_index.get("学号", -1)] or "").strip()
        if not student_no:
            failed_rows.append(idx)
            continue

        scores: list[SubjectScore] = []
        for subject in _SUBJECTS:
            col = col_index.get(subject)
            if col is None:
                continue
            score = _parse_score(row[col])
            if score is not None:
                scores.append(SubjectScore(subject=subject, score=score, trend="flat"))

        role_col = col_index.get("角色")
        role_raw = str(row[role_col] if role_col is not None else "")
        role = _normalize_role(role_raw) or "member"

        note_col = col_index.get("评语")
        teacher_note = str(row[note_col] if note_col is not None else "").strip()

        try:
            records.append(
                AcademicRecordInput(
                    student_no=student_no,
                    scores=scores,
                    role=role,  # type: ignore[arg-type]
                    teacher_note=teacher_note,
                )
            )
        except Exception:  # pragma: no cover
            failed_rows.append(idx)

    if failed_rows:
        raise _validation_error("部分行解析失败", {"failed_rows": failed_rows})
    return records


def _records_from_file(file: UploadFile) -> list[AcademicRecordInput]:
    if file.size is not None and file.size > 2 * 1024 * 1024:
        raise _validation_error("文件大小超过 2MB 限制")

    content = file.file.read()
    filename = (file.filename or "").lower()
    if filename.endswith(".csv"):
        return _parse_csv_file(content)
    if filename.endswith(".xlsx"):
        return _parse_xlsx_file(content)
    raise _validation_error("仅支持 .csv/.xlsx 文件", {"filename": file.filename})


def _upsert_records(
    conn: sqlite3.Connection,
    class_code: str,
    records: list[AcademicRecordInput],
) -> AcademicSummary:
    students = _load_class_students(conn, class_code)
    unknown_nos = [r.student_no for r in records if r.student_no not in students]
    if unknown_nos:
        raise _validation_error("存在未知学号", {"unknown_nos": unknown_nos})

    for rec in records:
        info = students[rec.student_no]
        _insert_record(conn, info[0], rec.scores, rec.role, rec.teacher_note)
    conn.commit()

    return _build_summary(conn, class_code)


def _latest_records(conn: sqlite3.Connection, class_code: str) -> list[sqlite3.Row]:
    rows = conn.execute(
        """
        SELECT ar.*, s.student_id, s.name, s.student_no
        FROM academic_records ar
        JOIN students s ON ar.student_id = s.student_id
        WHERE s.class_code = ?
          AND ar.id = (
              SELECT MAX(id) FROM academic_records ar2
              WHERE ar2.student_id = ar.student_id
          )
        ORDER BY s.student_no
        """,
        (class_code,),
    ).fetchall()
    return rows


def _score_history(
    conn: sqlite3.Connection, student_id: str
) -> list[list[SubjectScore]]:
    rows = conn.execute(
        "SELECT scores FROM academic_records WHERE student_id = ? ORDER BY id DESC LIMIT 2",
        (student_id,),
    ).fetchall()
    history: list[list[SubjectScore]] = []
    for row in rows:
        raw = row["scores"]
        if not raw:
            history.append([])
            continue
        try:
            data = json.loads(raw)
            scores = [
                SubjectScore(subject=s["subject"], score=s["score"], trend="flat")
                for s in data
                if isinstance(s, dict) and "subject" in s and "score" in s
            ]
            history.append(scores)
        except json.JSONDecodeError:
            history.append([])
    return history


def _compute_trend(
    conn: sqlite3.Connection, student_id: str, subject: str, current_score: int
) -> str:
    history = _score_history(conn, student_id)
    if len(history) < 2:
        return "flat"
    prev_scores = {s.subject: s.score for s in history[1]}
    prev = prev_scores.get(subject)
    if prev is None:
        return "flat"
    if current_score > prev:
        return "up"
    if current_score < prev:
        return "down"
    return "flat"


def _build_record(conn: sqlite3.Connection, row: sqlite3.Row) -> AcademicRecord:
    scores_raw = row["scores"]
    scores: list[SubjectScore] = []
    if scores_raw:
        try:
            data = json.loads(scores_raw)
            for s in data:
                if isinstance(s, dict) and "subject" in s and "score" in s:
                    subject = str(s["subject"])
                    score = int(s["score"])
                    trend = _compute_trend(conn, row["student_id"], subject, score)
                    scores.append(SubjectScore(subject=subject, score=score, trend=trend))  # type: ignore[arg-type]
        except (json.JSONDecodeError, ValueError):
            scores = []

    updated_at = row["updated_at"]
    return AcademicRecord(
        student_id=row["student_id"],
        student_no=row["student_no"],
        name=row["name"],
        role=row["role"],
        scores=scores,
        teacher_note=row["teacher_note"],
        updated_at=datetime.fromisoformat(updated_at) if updated_at else _now(),
    )


def _build_summary(conn: sqlite3.Connection, class_code: str) -> AcademicSummary:
    rows = _latest_records(conn, class_code)
    records = [_build_record(conn, row) for row in rows]

    count = len(records)
    all_scores: list[int] = []
    attention_count = 0
    for rec in records:
        for sc in rec.scores:
            all_scores.append(sc.score)
            if sc.trend == "down":
                attention_count += 1

    avg_score = round(sum(all_scores) / len(all_scores)) if all_scores else 0
    summary = {
        "count": count,
        "avg_score": avg_score,
        "attention_count": attention_count,
    }
    return AcademicSummary(records=records, summary=summary)


@router.post("/{class_code}/academic", response_model=AcademicSummary)
async def upsert_academic(
    class_code: str,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
) -> AcademicSummary:
    """R14：导入学情档案。支持 JSON 或 multipart 文件（csv/xlsx）。"""
    if user.class_code != class_code:
        raise _class_not_found(class_code)

    conn = get_db_connection()
    try:
        cls = conn.execute(
            "SELECT class_code FROM classes WHERE class_code = ?", (class_code,)
        ).fetchone()
        if cls is None:
            raise _class_not_found(class_code)

        content_type = request.headers.get("content-type", "")
        if content_type.startswith("multipart/form-data"):
            form = await request.form()
            file = form.get("file")
            if file is None or not isinstance(file, UploadFile):
                raise _validation_error("缺少 file 字段")
            records = _records_from_file(file)
        else:
            try:
                body = await request.json()
            except json.JSONDecodeError as exc:
                raise _validation_error("请求体不是合法 JSON") from exc
            if not isinstance(body, dict) or "records" not in body:
                raise _validation_error("JSON 请求必须包含 records 字段")
            raw_records = body["records"]
            if not isinstance(raw_records, list):
                raise _validation_error("records 必须是数组")
            try:
                records = [AcademicRecordInput(**r) for r in raw_records]
            except Exception as exc:
                raise _validation_error(f"记录格式错误: {exc}") from exc

        return _upsert_records(conn, class_code, records)
    finally:
        conn.close()


@router.get("/{class_code}/academic", response_model=AcademicSummary)
def get_academic_summary(
    class_code: str, user: CurrentUser = Depends(get_current_user)
) -> AcademicSummary:
    """R15：班级学情汇总。"""
    if user.class_code != class_code:
        raise _class_not_found(class_code)

    conn = get_db_connection()
    try:
        cls = conn.execute(
            "SELECT class_code FROM classes WHERE class_code = ?", (class_code,)
        ).fetchone()
        if cls is None:
            raise _class_not_found(class_code)
        return _build_summary(conn, class_code)
    finally:
        conn.close()
