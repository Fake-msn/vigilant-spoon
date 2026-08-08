"""写信异步任务（F4-02）：周 cron + 手动触发，幂等执行。"""

from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone

from app.db import get_db_connection
from app.services.letter import render_letter_for_student


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _letter_id(student_id: str, now: datetime) -> str:
    return f"letter-{student_id}-{now.strftime('%Y%m%d')}"


def _date_str(now: datetime) -> str:
    return now.strftime("%m-%d")


def run_letter_job(
    student_id: str,
    idempotency_key: str | None = None,
    conn: sqlite3.Connection | None = None,
) -> str:
    """同步执行写信任务并落库，返回 job_id。

    幂等：同一 idempotency_key 已存在成功 job 时直接返回旧 job_id。
    """
    own_conn = conn is None
    db = get_db_connection() if own_conn else conn
    assert db is not None

    try:
        # 1) 幂等检查
        if idempotency_key:
            existing = db.execute(
                "SELECT job_id, status FROM jobs WHERE idempotency_key = ?",
                (idempotency_key,),
            ).fetchone()
            if existing is not None and existing["status"] in ("done", "running"):
                return str(existing["job_id"])

        job_id = f"job-letter-{uuid.uuid4().hex[:16]}"
        now = _now()

        # 2) 创建 job 记录
        db.execute(
            """
            INSERT INTO jobs (
                job_id, student_id, job_type, status,
                idempotency_key, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                job_id,
                student_id,
                "letter",
                "running",
                idempotency_key,
                now.isoformat(),
                now.isoformat(),
            ),
        )
        db.commit()

        try:
            # 3) 生成信件
            letter = render_letter_for_student(db, student_id, now=now)
            letter_id = _letter_id(student_id, now)
            date_str = _date_str(now)

            # 4) 写入 letters 表（同一日幂等覆盖）
            db.execute(
                """
                INSERT OR REPLACE INTO letters (
                    letter_id, student_id, title, date,
                    is_read, preview, body, generated_at, source
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    letter_id,
                    student_id,
                    letter.title,
                    date_str,
                    0,
                    letter.preview,
                    "\n\n".join(letter.body),
                    now.isoformat(),
                    letter.source,
                ),
            )

            # 5) 更新 job 为完成
            done_at = _now()
            result_url = f"/students/{student_id}/letters/{letter_id}"
            db.execute(
                """
                UPDATE jobs
                SET status = ?, result_url = ?, updated_at = ?
                WHERE job_id = ?
                """,
                ("done", result_url, done_at.isoformat(), job_id),
            )
            db.commit()
        except Exception as exc:
            failed_at = _now()
            db.execute(
                """
                UPDATE jobs
                SET status = ?, error_code = ?, error_message = ?, updated_at = ?
                WHERE job_id = ?
                """,
                (
                    "failed",
                    "LETTER_GENERATION_FAILED",
                    str(exc)[:200],
                    failed_at.isoformat(),
                    job_id,
                ),
            )
            db.commit()
            raise

        return job_id
    finally:
        if own_conn:
            db.close()


def schedule_weekly_letters(conn: sqlite3.Connection | None = None) -> list[str]:
    """为全班学生批量生成本周信件，返回生成的 job_id 列表。"""
    own_conn = conn is None
    db = get_db_connection() if own_conn else conn
    assert db is not None

    try:
        rows = db.execute(
            "SELECT student_id FROM students ORDER BY student_id"
        ).fetchall()
        job_ids: list[str] = []
        for row in rows:
            student_id = row["student_id"]
            week_key = f"weekly-letter-{student_id}-{_now().strftime('%Y-W%W')}"
            try:
                job_id = run_letter_job(student_id, idempotency_key=week_key, conn=db)
                job_ids.append(job_id)
            except Exception:
                # 单学生失败不影响其他同学
                continue
        return job_ids
    finally:
        if own_conn:
            db.close()
