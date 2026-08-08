"""班宠积分制度：加减分 / 规则 / 小组 / 排行榜。"""

from __future__ import annotations

import sqlite3
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.db import get_db_connection
from app.deps import CurrentUser, get_current_user
from app.schemas import (
    ErrorEnvelope,
    GroupConfigReq,
    GroupView,
    LeaderboardItem,
    LeaderboardView,
    PointAwardReq,
    PointAwardResp,
    PointLedgerEntry,
    PointOverview,
    PointRule,
    PointRuleUpdateReq,
)
from app.services.pet import apply_points, level_for, now_utc

router = APIRouter(prefix="/classes", tags=["points"])

DEFAULT_RULES: list[tuple[str, str, int]] = [
    ("hand-raise", "主动举手发言", 5),
    ("answer", "回答正确", 10),
    ("homework-on-time", "作业按时提交", 8),
    ("homework-excellent", "作业优秀", 15),
]


def _now() -> datetime:
    return now_utc()


def _err(code: str, message: str, status_code: int = 404) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail=ErrorEnvelope(code=code, message=message).model_dump(),
    )


def _teacher_only(user: CurrentUser) -> None:
    if user.user_type != "teacher":
        raise _err("FORBIDDEN", "仅教师可操作", status.HTTP_403_FORBIDDEN)


def _ensure_class(conn: sqlite3.Connection, code: str) -> None:
    if conn.execute("SELECT 1 FROM classes WHERE class_code = ?", (code,)).fetchone() is None:
        raise _err("CLASS_NOT_FOUND", "班级码不存在")


def _seed_rules(conn: sqlite3.Connection, code: str) -> None:
    for i, (cat, name, points) in enumerate(DEFAULT_RULES):
        conn.execute(
            "INSERT OR IGNORE INTO point_rules "
            "(rule_id, class_code, name, points, category, enabled, sort, created_at) "
            "VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
            (f"{code}-{cat}", code, name, points, cat, i, _now().isoformat()),
        )


def _row_rules(conn: sqlite3.Connection, code: str) -> list[PointRule]:
    rows = conn.execute(
        "SELECT rule_id, name, points, category, enabled FROM point_rules "
        "WHERE class_code = ? ORDER BY sort, created_at",
        (code,),
    ).fetchall()
    return [
        PointRule(
            rule_id=r["rule_id"],
            name=r["name"],
            points=r["points"],
            category=r["category"],
            enabled=bool(r["enabled"]),
        )
        for r in rows
    ]


@router.get("/{code}/points/rules", response_model=list[PointRule])
def get_rules(code: str, user: CurrentUser = Depends(get_current_user)) -> list[PointRule]:
    if user.class_code != code:
        raise _err("CLASS_NOT_FOUND", "班级码不存在")
    conn = get_db_connection()
    try:
        _ensure_class(conn, code)
        return _row_rules(conn, code)
    finally:
        conn.close()


@router.put("/{code}/points/rules", response_model=list[PointRule])
def update_rules(
    code: str, req: PointRuleUpdateReq, user: CurrentUser = Depends(get_current_user)
) -> list[PointRule]:
    if user.class_code != code:
        raise _err("CLASS_NOT_FOUND", "班级码不存在")
    _teacher_only(user)
    conn = get_db_connection()
    try:
        _ensure_class(conn, code)
        conn.execute("DELETE FROM point_rules WHERE class_code = ?", (code,))
        for i, r in enumerate(req.rules):
            rid = r.rule_id or f"{code}-{i}-{_now().timestamp()}"
            conn.execute(
                "INSERT INTO point_rules "
                "(rule_id, class_code, name, points, category, enabled, sort, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (rid, code, r.name, r.points, r.category,
                 1 if r.enabled else 0, i, _now().isoformat()),
            )
        conn.commit()
        return _row_rules(conn, code)
    finally:
        conn.close()


@router.post("/{code}/points/award", response_model=PointAwardResp)
def award_points(
    code: str, req: PointAwardReq, user: CurrentUser = Depends(get_current_user)
) -> PointAwardResp:
    if user.class_code != code:
        raise _err("CLASS_NOT_FOUND", "班级码不存在")
    _teacher_only(user)
    conn = get_db_connection()
    try:
        _ensure_class(conn, code)
        student = conn.execute(
            "SELECT student_id FROM students WHERE student_id = ? AND class_code = ?",
            (req.student_id, code),
        ).fetchone()
        if student is None:
            raise _err("STUDENT_NOT_FOUND", "学生不在当前班级")

        points = req.points
        name = req.name
        if req.rule_id:
            rule = conn.execute(
                "SELECT name, points FROM point_rules WHERE rule_id = ? AND class_code = ?",
                (req.rule_id, code),
            ).fetchone()
            if rule is not None:
                if points is None:
                    points = rule["points"]
                if name is None:
                    name = rule["name"]
        if points is None:
            points = 0
        if name is None:
            name = "自定义"

        growth = conn.execute(
            "SELECT * FROM growth_records WHERE student_id = ?", (req.student_id,)
        ).fetchone()
        if growth is None:
            raise _err("STUDENT_NOT_FOUND", "学生成长记录不存在")

        now = _now()
        hunger = int(growth["hunger"] or 50)
        mood = int(growth["mood"] or 60)
        new_hunger, new_mood = apply_points(hunger, mood, points)
        points_total = int(growth["points_total"] or 0) + points
        new_level = level_for(points_total)
        old_level = int(growth["level"] or 1)
        leveled_up = new_level > old_level

        cur = conn.execute(
            "INSERT INTO point_ledger "
            "(student_id, class_code, rule_id, name, points, note, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (req.student_id, code, req.rule_id, name, points, req.note, now.isoformat()),
        )
        ledger_id = cur.lastrowid
        if ledger_id is None:
            raise _err("INTERNAL", "写入流水失败", status.HTTP_500_INTERNAL_SERVER_ERROR)

        conn.execute(
            "UPDATE growth_records SET points_total = ?, level = ?, hunger = ?, mood = ?, "
            "last_points_at = ? WHERE student_id = ?",
            (points_total, new_level, new_hunger, new_mood, now.isoformat(), req.student_id),
        )
        conn.commit()
        return PointAwardResp(
            student_id=req.student_id,
            points=points,
            points_total=points_total,
            level=new_level,
            leveled_up=leveled_up,
            hunger=new_hunger,
            mood=new_mood,
            state=growth["state"] or "daily",
            ledger_id=ledger_id,
        )
    finally:
        conn.close()


def _row_groups(conn: sqlite3.Connection, code: str) -> list[GroupView]:
    rows = conn.execute(
        "SELECT group_id, group_name, color FROM groups WHERE class_code = ?", (code,)
    ).fetchall()
    views: list[GroupView] = []
    for g in rows:
        members = [
            r["student_id"]
            for r in conn.execute(
                "SELECT student_id FROM students WHERE class_code = ? AND group_id = ?",
                (code, g["group_id"]),
            ).fetchall()
        ]
        views.append(
            GroupView(
                group_id=g["group_id"],
                group_name=g["group_name"],
                color=g["color"],
                members=members,
            )
        )
    return views


@router.get("/{code}/points/overview", response_model=PointOverview)
def get_overview(code: str, user: CurrentUser = Depends(get_current_user)) -> PointOverview:
    if user.class_code != code:
        raise _err("CLASS_NOT_FOUND", "班级码不存在")
    conn = get_db_connection()
    try:
        _ensure_class(conn, code)
        _seed_rules(conn, code)
        conn.commit()
        rules = [r for r in _row_rules(conn, code) if r.enabled]
        students = [
            {"id": row["student_id"], "name": row["name"], "group_id": row["group_id"]}
            for row in conn.execute(
                "SELECT student_id, name, group_id FROM students "
                "WHERE class_code = ? ORDER BY student_no",
                (code,),
            ).fetchall()
        ]
        groups = _row_groups(conn, code)
        return PointOverview(rules=rules, students=students, groups=groups)
    finally:
        conn.close()


@router.get("/{code}/groups", response_model=list[GroupView])
def get_groups(code: str, user: CurrentUser = Depends(get_current_user)) -> list[GroupView]:
    if user.class_code != code:
        raise _err("CLASS_NOT_FOUND", "班级码不存在")
    conn = get_db_connection()
    try:
        _ensure_class(conn, code)
        return _row_groups(conn, code)
    finally:
        conn.close()


@router.put("/{code}/groups", response_model=list[GroupView])
def config_groups(
    code: str, req: GroupConfigReq, user: CurrentUser = Depends(get_current_user)
) -> list[GroupView]:
    if user.class_code != code:
        raise _err("CLASS_NOT_FOUND", "班级码不存在")
    _teacher_only(user)
    conn = get_db_connection()
    try:
        _ensure_class(conn, code)
        conn.execute("DELETE FROM groups WHERE class_code = ?", (code,))
        conn.execute("UPDATE students SET group_id = NULL WHERE class_code = ?", (code,))
        for i, g in enumerate(req.groups, start=1):
            gid = f"{code}-g{i:02d}"
            conn.execute(
                "INSERT INTO groups (group_id, class_code, group_name, color) VALUES (?, ?, ?, ?)",
                (gid, code, g.group_name, g.color),
            )
        for sid, gid in (req.assignments or {}).items():
            exists = conn.execute(
                "SELECT 1 FROM groups WHERE group_id = ? AND class_code = ?", (gid, code)
            ).fetchone()
            if exists:
                conn.execute(
                    "UPDATE students SET group_id = ? WHERE student_id = ? AND class_code = ?",
                    (gid, sid, code),
                )
        conn.commit()
        return _row_groups(conn, code)
    finally:
        conn.close()


@router.get("/{code}/leaderboard", response_model=LeaderboardView)
def leaderboard(code: str, user: CurrentUser = Depends(get_current_user)) -> LeaderboardView:
    if user.class_code != code:
        raise _err("CLASS_NOT_FOUND", "班级码不存在")
    _teacher_only(user)
    conn = get_db_connection()
    try:
        _ensure_class(conn, code)
        rows = conn.execute(
            """
            SELECT g.group_id, g.group_name, g.color,
                   COALESCE(SUM(gr.points_total), 0) AS total_points,
                   COUNT(s.student_id) AS member_count
            FROM groups g
            LEFT JOIN students s ON s.group_id = g.group_id AND s.class_code = g.class_code
            LEFT JOIN growth_records gr ON gr.student_id = s.student_id
            WHERE g.class_code = ?
            GROUP BY g.group_id
            ORDER BY total_points DESC
            """,
            (code,),
        ).fetchall()
        items = [
            LeaderboardItem(
                group_id=r["group_id"],
                group_name=r["group_name"],
                color=r["color"],
                total_points=int(r["total_points"]),
                member_count=int(r["member_count"]),
            )
            for r in rows
        ]
        return LeaderboardView(items=items)
    finally:
        conn.close()


@router.get("/students/{student_id}/points", response_model=list[PointLedgerEntry])
def student_points(
    student_id: str, user: CurrentUser = Depends(get_current_user)
) -> list[PointLedgerEntry]:
    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT class_code FROM students WHERE student_id = ?", (student_id,)
        ).fetchone()
        if row is None:
            raise _err("STUDENT_NOT_FOUND", "学生不存在")
        if user.user_type == "teacher" and user.class_code != row["class_code"]:
            raise _err("FORBIDDEN", "无权查看", status.HTTP_403_FORBIDDEN)
        if user.user_type == "student" and user.user_id != student_id:
            raise _err("FORBIDDEN", "无权查看", status.HTTP_403_FORBIDDEN)
        rows = conn.execute(
            "SELECT id, name, points, note, created_at FROM point_ledger "
            "WHERE student_id = ? ORDER BY id DESC LIMIT 100",
            (student_id,),
        ).fetchall()
        return [
            PointLedgerEntry(
                id=r["id"], name=r["name"], points=r["points"],
                note=r["note"], created_at=datetime.fromisoformat(r["created_at"]),
            )
            for r in rows
        ]
    finally:
        conn.close()
