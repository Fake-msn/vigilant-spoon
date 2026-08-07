#!/usr/bin/env python3
"""演示数据 seed，与 web-spa/src/mocks/data.ts 同源。

用法：
    python server/scripts/seed.py [--fresh] [sqlite_path]

每次运行都会清空表并重新插入，保证演示库状态幂等。
--fresh 保留以兼容旧调用习惯。
"""

from __future__ import annotations

import argparse
import json
import logging
import sqlite3
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.db.migrate import migrate_up

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed")

# 与 mocks/data.ts 同源：1 班级 + 8 学生
CLASS: dict[str, Any] = {
    "class_code": "LTZ2024",
    "class_name": "三（1）班",
    "school": "龙头山镇中心小学",
    "region_key": "yunnan",
    "grade": "三年级",
    "class_no": "1",
}

STUDENTS: list[dict[str, Any]] = [
    {
        "id": "wxy",
        "name": "王小雅",
        "grade": "三年级",
        "student_no": "2023001",
        "ideal": "蛋糕师",
        "avatar_seed": 0,
        "role": "member",
    },
    {
        "id": "lxj",
        "name": "李小军",
        "grade": "四年级",
        "student_no": "2023002",
        "ideal": "军人",
        "avatar_seed": 1,
        "role": "group_leader",
    },
    {
        "id": "zxh",
        "name": "张小花",
        "grade": "三年级",
        "student_no": "2023003",
        "ideal": None,
        "avatar_seed": 2,
        "role": "member",
    },
    {
        "id": "lxh",
        "name": "刘小虎",
        "grade": "五年级",
        "student_no": "2023004",
        "ideal": "科学家",
        "avatar_seed": 3,
        "role": "subject_rep",
    },
    {
        "id": "cxy",
        "name": "陈小雨",
        "grade": "四年级",
        "student_no": "2023005",
        "ideal": None,
        "avatar_seed": 4,
        "role": "member",
    },
    {
        "id": "zxj",
        "name": "周小杰",
        "grade": "五年级",
        "student_no": "2023006",
        "ideal": "教师",
        "avatar_seed": 5,
        "role": "subject_rep",
    },
    {
        "id": "wxx",
        "name": "吴小雪",
        "grade": "三年级",
        "student_no": "2023007",
        "ideal": None,
        "avatar_seed": 6,
        "role": "member",
    },
    {
        "id": "zxy2",
        "name": "郑小阳",
        "grade": "四年级",
        "student_no": "2023008",
        "ideal": "医生",
        "avatar_seed": 7,
        "role": "member",
    },
]

ACADEMIC_RECORDS: list[dict[str, Any]] = [
    {
        "student_id": "wxy",
        "scores": [
            {"subject": "语文", "score": 88, "trend": "up"},
            {"subject": "数学", "score": 76, "trend": "down"},
            {"subject": "英语", "score": 82, "trend": "flat"},
        ],
        "role": "member",
        "teacher_note": "课余常帮妈妈做家务，动手能力强，提到做蛋糕时眼睛发亮",
    },
    {
        "student_id": "lxj",
        "scores": [
            {"subject": "语文", "score": 79, "trend": "flat"},
            {"subject": "数学", "score": 85, "trend": "up"},
            {"subject": "英语", "score": 71, "trend": "up"},
        ],
        "role": "group_leader",
        "teacher_note": "体育课表现突出，纪律性强，爷爷曾是退伍军人",
    },
    {
        "student_id": "zxh",
        "scores": [
            {"subject": "语文", "score": 92, "trend": "up"},
            {"subject": "数学", "score": 68, "trend": "down"},
            {"subject": "英语", "score": 75, "trend": "flat"},
        ],
        "role": "member",
        "teacher_note": "喜欢画画，作文常写到山外面的世界，性格偏内向",
    },
    {
        "student_id": "lxh",
        "scores": [
            {"subject": "语文", "score": 74, "trend": "flat"},
            {"subject": "数学", "score": 95, "trend": "up"},
            {"subject": "英语", "score": 80, "trend": "up"},
        ],
        "role": "subject_rep",
        "teacher_note": "对自然科学兴趣浓厚，常问\"为什么\"，家里支持读书",
    },
    {
        "student_id": "cxy",
        "scores": [
            {"subject": "语文", "score": 66, "trend": "down"},
            {"subject": "数学", "score": 62, "trend": "down"},
            {"subject": "英语", "score": 58, "trend": "down"},
        ],
        "role": "member",
        "teacher_note": "父母外出务工，由奶奶照顾，近期上课注意力下降，需要更多关注",
    },
    {
        "student_id": "zxj",
        "scores": [
            {"subject": "语文", "score": 86, "trend": "up"},
            {"subject": "数学", "score": 78, "trend": "flat"},
            {"subject": "英语", "score": 84, "trend": "up"},
        ],
        "role": "subject_rep",
        "teacher_note": "乐于帮助同学讲题，说想像老师一样站上讲台",
    },
    {
        "student_id": "wxx",
        "scores": [
            {"subject": "语文", "score": 71, "trend": "flat"},
            {"subject": "数学", "score": 65, "trend": "down"},
            {"subject": "英语", "score": 69, "trend": "flat"},
        ],
        "role": "member",
        "teacher_note": "刚转学过来一学期，还在适应新环境，课堂发言较少",
    },
    {
        "student_id": "zxy2",
        "scores": [
            {"subject": "语文", "score": 83, "trend": "up"},
            {"subject": "数学", "score": 88, "trend": "up"},
            {"subject": "英语", "score": 79, "trend": "flat"},
        ],
        "role": "member",
        "teacher_note": "奶奶生病后开始说想当医生，责任感强，成绩稳步上升",
    },
]

def _species_for(ideal: str | None) -> str:
    mapping = {
        "蛋糕师": "baker",
        "军人": "soldier",
        "科学家": "scientist",
        "教师": "teacher",
        "医生": "doctor",
    }
    return mapping.get(ideal or "", "cat")


def _stage_for(growth_value: int) -> str:
    if growth_value >= 100:
        return "bloom"
    if growth_value >= 50:
        return "bud"
    if growth_value >= 20:
        return "sprout"
    return "egg"


def _pet_stage_for(growth_value: int) -> int:
    if growth_value >= 100:
        return 3
    if growth_value >= 50:
        return 2
    if growth_value >= 20:
        return 1
    return 0


GROWTH_RECORDS: list[dict[str, Any]] = [
    {
        "student_id": "wxy",
        "state": "daily",
        "needs_care": False,
        "signal": None,
        "growth_value": 35,
        "species": _species_for("蛋糕师"),
        "last_gist": "这周揉了面团，离蛋糕师更近一步",
        "commitments": [
            {
                "id": "c1",
                "text": "每天帮妈妈做一次家务",
                "created_at": "2026-07-20T10:00:00+00:00",
                "status": "fulfilled",
            },
            {
                "id": "c2",
                "text": "学会做一个纸杯蛋糕",
                "created_at": "2026-07-25T10:00:00+00:00",
                "status": "active",
            },
        ],
        "actions": [
            {
                "id": "a1",
                "text": "帮妈妈揉面团",
                "done": True,
                "created_at": "2026-07-28T08:00:00+00:00",
            },
        ],
        "history": [
            {"date": "今天", "topic": "蛋糕师的梦想", "state": "cheer", "mins": 6},
            {"date": "昨天", "topic": "帮妈妈揉面团", "state": "daily", "mins": 5},
            {"date": "3 天前", "topic": "甜甜的纸杯蛋糕", "state": "daily", "mins": 8},
            {"date": "上周", "topic": "第一次说出梦想", "state": "daily", "mins": 4},
        ],
    },
    {
        "student_id": "lxj",
        "state": "cheer",
        "needs_care": False,
        "signal": None,
        "growth_value": 62,
        "species": _species_for("军人"),
        "last_gist": "立志像爷爷一样保家卫国",
        "commitments": [
            {
                "id": "c1",
                "text": "每天跑步 10 分钟",
                "created_at": "2026-07-22T10:00:00+00:00",
                "status": "active",
            },
        ],
        "actions": [
            {
                "id": "a1",
                "text": "体育课带领热身",
                "done": True,
                "created_at": "2026-08-01T08:00:00+00:00",
            },
        ],
        "history": [
            {"date": "今天", "topic": "爷爷的军装", "state": "cheer", "mins": 7},
            {"date": "上周", "topic": "我的梦想是军人", "state": "daily", "mins": 5},
        ],
    },
    {
        "student_id": "zxh",
        "state": "daily",
        "needs_care": False,
        "signal": None,
        "growth_value": 28,
        "species": _species_for(None),
        "last_gist": "画了山外的梯田，想去看更大的世界",
        "commitments": [
            {
                "id": "c1",
                "text": "每周画一幅家乡的画",
                "created_at": "2026-07-26T10:00:00+00:00",
                "status": "active",
            },
        ],
        "actions": [],
        "history": [
            {"date": "昨天", "topic": "山外面的世界", "state": "daily", "mins": 6},
        ],
    },
    {
        "student_id": "lxh",
        "state": "cheer",
        "needs_care": False,
        "signal": None,
        "growth_value": 75,
        "species": _species_for("科学家"),
        "last_gist": "连续问了三个为什么，眼睛亮亮的",
        "commitments": [
            {
                "id": "c1",
                "text": "记录一个自然观察",
                "created_at": "2026-07-21T10:00:00+00:00",
                "status": "fulfilled",
            },
        ],
        "actions": [
            {
                "id": "a1",
                "text": "观察蚂蚁搬家并记录",
                "done": True,
                "created_at": "2026-08-02T08:00:00+00:00",
            },
        ],
        "history": [
            {"date": "今天", "topic": "星星为什么会眨眼", "state": "cheer", "mins": 8},
            {"date": "上周", "topic": "我想当科学家", "state": "daily", "mins": 5},
        ],
    },
    {
        "student_id": "cxy",
        "state": "gray",
        "needs_care": True,
        "signal": '连续两次提到"想爸爸妈妈"，建议本周安排一次线下谈心',
        "growth_value": 12,
        "species": _species_for(None),
        "last_gist": "提到爸爸妈妈时声音变小",
        "commitments": [
            {
                "id": "c1",
                "text": "每天和奶奶说一件开心的事",
                "created_at": "2026-07-27T10:00:00+00:00",
                "status": "active",
            },
        ],
        "actions": [],
        "history": [
            {"date": "今天", "topic": "想爸爸妈妈", "state": "gray", "mins": 5},
            {"date": "3 天前", "topic": "周末想做什么", "state": "daily", "mins": 4},
        ],
    },
    {
        "student_id": "zxj",
        "state": "daily",
        "needs_care": False,
        "signal": None,
        "growth_value": 48,
        "species": _species_for("教师"),
        "last_gist": "主动帮同桌讲题，说想站上讲台",
        "commitments": [
            {
                "id": "c1",
                "text": "每周给同学讲一道题",
                "created_at": "2026-07-23T10:00:00+00:00",
                "status": "active",
            },
        ],
        "actions": [
            {
                "id": "a1",
                "text": "给李小军讲数学题",
                "done": True,
                "created_at": "2026-08-03T08:00:00+00:00",
            },
        ],
        "history": [
            {"date": "昨天", "topic": "我想当老师", "state": "daily", "mins": 6},
        ],
    },
    {
        "student_id": "wxx",
        "state": "gray",
        "needs_care": True,
        "signal": "转学适应期，情绪偏紧张，建议先从兴趣话题切入",
        "growth_value": 18,
        "species": _species_for(None),
        "last_gist": "新环境里发言很少",
        "commitments": [
            {
                "id": "c1",
                "text": "每天和一个新同学打招呼",
                "created_at": "2026-07-28T10:00:00+00:00",
                "status": "active",
            },
        ],
        "actions": [],
        "history": [
            {"date": "今天", "topic": "新学校还好吗", "state": "gray", "mins": 5},
        ],
    },
    {
        "student_id": "zxy2",
        "state": "daily",
        "needs_care": False,
        "signal": None,
        "growth_value": 55,
        "species": _species_for("医生"),
        "last_gist": "说想治好奶奶的病，很有责任感",
        "commitments": [
            {
                "id": "c1",
                "text": "每周了解一个身体器官知识",
                "created_at": "2026-07-24T10:00:00+00:00",
                "status": "active",
            },
        ],
        "actions": [
            {
                "id": "a1",
                "text": "读了一本人体科普书",
                "done": True,
                "created_at": "2026-08-04T08:00:00+00:00",
            },
        ],
        "history": [
            {"date": "昨天", "topic": "我想当医生", "state": "daily", "mins": 7},
        ],
    },
]

COURSES: list[dict[str, Any]] = [
    {
        "id": "c4",
        "topic": "我的梦想清单",
        "date": "08-01",
        "duration": "40 分钟",
        "joined": 5,
        "status": "active",
        "goal": "引导每位同学说出一个具体理想，并想一件本周能做的小事",
        "traces": json.dumps(
            ["5 位同学完成对话并生成梦想画像", "陈小雨触发心理信号，已提醒关注"],
            ensure_ascii=False,
        ),
    },
    {
        "id": "c3",
        "topic": "长大后的我",
        "date": "07-25",
        "duration": "45 分钟",
        "joined": 8,
        "status": "done",
        "goal": "结合\"唯有读书高?\"讨论多元职业价值，人人参与不评判",
        "traces": json.dumps(
            [
                "8 位同学全部完成对话",
                "新增 3 个理想：画家、医生、教师",
                "平均成长值 +12",
            ],
            ensure_ascii=False,
        ),
    },
    {
        "id": "c2",
        "topic": "家乡与远方",
        "date": "07-18",
        "duration": "40 分钟",
        "joined": 7,
        "status": "done",
        "goal": "从家乡生活出发，聊聊\"山外面的世界\"，拓宽职业想象",
        "traces": json.dumps(
            ["地区上下文首次接入对话", "张小花第一次主动发言并画了梯田"],
            ensure_ascii=False,
        ),
    },
    {
        "id": "c1",
        "topic": "第一次和小信见面",
        "date": "07-11",
        "duration": "35 分钟",
        "joined": 8,
        "status": "done",
        "goal": "建立信任：让每位同学和 AI 打招呼，说一件开心的事",
        "traces": json.dumps(
            ["全班建立成长档案", "每人领到专属像素小宠物"],
            ensure_ascii=False,
        ),
    },
]

LETTERS: list[dict[str, Any]] = [
    {
        "id": "w3",
        "student_id": "wxy",
        "title": "第 3 周的来信",
        "date": "07-28",
        "is_read": False,
        "preview": "我一直记得你的梦想是成为蛋糕师，这周你的小宠物……",
        "generated_at": "2026-07-28T09:00:00+08:00",
        "source": "template",
        "body": [
            "致龙头山镇中心小学三年级的王小雅同学：",
            "我一直记得你的梦想是成为蛋糕师。这周你的蛋糕师小宠物看起来有点没精神——它告诉我，你已经好几天没和它分享新消息了。",
            "你平时会在课余帮妈妈进厨房打下手吗？哪怕只是搅一搅面糊、摆一摆盘子，都是在为梦想积攒力气呀。要不要和班主任老师聊聊，一起为你的小宠物赚取成长值？",
            "期待下周听到你的新故事。",
        ],
    },
    {
        "id": "w2",
        "student_id": "wxy",
        "title": "第 2 周的来信",
        "date": "07-21",
        "is_read": True,
        "preview": "上次你说想学会做纸杯蛋糕，不知道这周有没有……",
        "generated_at": "2026-07-21T09:00:00+08:00",
        "source": "template",
        "body": [
            "致龙头山镇中心小学三年级的王小雅同学：",
            "上次你说想学会做草莓味的纸杯蛋糕，不知道这周有没有离它近一点？",
            "听说你帮妈妈揉了面团，还弄得满脸面粉——在我看来，那可是蛋糕师的第一枚勋章。你的小宠物这周开心极了，因为它感受到了你的努力。",
            "继续加油，下周也要记得来和我聊聊哦。",
        ],
    },
    {
        "id": "w1",
        "student_id": "wxy",
        "title": "第 1 周的来信",
        "date": "07-14",
        "is_read": True,
        "preview": "这是我们写给你的第一封信。从今天起，你有了一只……",
        "generated_at": "2026-07-14T09:00:00+08:00",
        "source": "template",
        "body": [
            "致龙头山镇中心小学三年级的王小雅同学：",
            "这是我们写给你的第一封信。从今天起，你有了一只专属的梦想小宠物，它会陪着你一起长大。",
            "你说过，你的梦想是成为一名蛋糕师。记住这个甜甜的心愿，以后的每一周，我都想听听你为它做了什么。",
            "慢慢来，梦想不怕小，就怕不去靠近它。",
        ],
    },
]


CREATE_SQL = """
CREATE TABLE IF NOT EXISTS classes (
    class_code TEXT PRIMARY KEY,
    class_name TEXT NOT NULL,
    school TEXT NOT NULL,
    region_key TEXT NOT NULL,
    grade TEXT NOT NULL,
    class_no TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    student_no TEXT NOT NULL UNIQUE,
    ideal TEXT,
    avatar_seed INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('member','group_leader','class_committee','subject_rep'))
);

CREATE TABLE IF NOT EXISTS academic_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL REFERENCES students(student_id),
    scores TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('member','group_leader','class_committee','subject_rep')),
    teacher_note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS growth_records (
    student_id TEXT PRIMARY KEY REFERENCES students(student_id),
    ideal TEXT,
    commitments TEXT,
    actions TEXT,
    stage TEXT,
    pet_state TEXT,
    last_gist TEXT,
    needs_care INTEGER NOT NULL DEFAULT 0,
    teacher_constraints TEXT,
    state TEXT NOT NULL CHECK(state IN ('daily','gray','cheer')),
    signal TEXT
);

CREATE TABLE IF NOT EXISTS courses (
    course_id TEXT PRIMARY KEY,
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    topic TEXT NOT NULL,
    date TEXT NOT NULL,
    duration TEXT,
    joined INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('active','done')),
    goal TEXT NOT NULL,
    traces TEXT
);

CREATE TABLE IF NOT EXISTS letters (
    letter_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(student_id),
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    preview TEXT NOT NULL,
    body TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source TEXT NOT NULL CHECK(source IN ('template','llm'))
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(student_id),
    class_code TEXT NOT NULL REFERENCES classes(class_code),
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
"""


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(CREATE_SQL)
    conn.commit()


def clear_tables(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        DELETE FROM classroom_sessions;
        DELETE FROM jobs;
        DELETE FROM teacher_sessions;
        DELETE FROM sessions;
        DELETE FROM letters;
        DELETE FROM courses;
        DELETE FROM growth_records;
        DELETE FROM academic_records;
        DELETE FROM students;
        DELETE FROM classes;
        """
    )
    conn.commit()


def validate_mapping() -> None:
    """在入库前验证关键字段映射规则。"""
    logger.info("开始验证关键字段映射规则")

    # 1. 学生 id 唯一
    ids = [s["id"] for s in STUDENTS]
    assert len(ids) == len(set(ids)), "学生 id 必须唯一"
    logger.info("学生 id 唯一性：通过（%d 人）", len(ids))

    # 2. no -> student_no 非空且唯一
    nos = [s["student_no"] for s in STUDENTS]
    assert all(nos), "student_no 不能为空"
    assert len(nos) == len(set(nos)), "student_no 必须唯一"
    logger.info("student_no 非空唯一性：通过")

    # 3. dream -> ideal：旧字段允许为空，映射后保留语义
    for s in STUDENTS:
        logger.info(
            "学生 %-4s %-6s ideal=%-6s student_no=%s",
            s["id"],
            s["name"],
            s["ideal"] or "（空）",
            s["student_no"],
        )

    # 4. relation -> role：亲近不得映射为 class_committee
    role_by_student = {rec["student_id"]: rec["role"] for rec in ACADEMIC_RECORDS}
    for student in STUDENTS:
        role = role_by_student.get(student["id"])
        assert role, f"学生 {student['id']} 缺少 role"
        assert role in {
            "member",
            "group_leader",
            "class_committee",
            "subject_rep",
        }, f"无效 role: {role}"
    logger.info("role 枚举有效性：通过")

    # 5. mood -> state：gray 态必须有 signal，daily/cheer 态 signal 应为空
    for rec in GROWTH_RECORDS:
        state = rec["state"]
        signal = rec["signal"]
        if state == "gray":
            assert signal, f"gray 态学生 {rec['student_id']} 必须有心理信号"
            assert rec["needs_care"], f"gray 态学生 {rec['student_id']} needs_care 应为 True"
        else:
            assert signal is None, f"非 gray 态学生 {rec['student_id']} 不应有 signal"
            assert not rec["needs_care"], (
                f"非 gray 态学生 {rec['student_id']} needs_care 应为 False"
            )
        logger.info(
            "成长 %-4s state=%-6s needs_care=%-5s signal=%s",
            rec["student_id"],
            state,
            rec["needs_care"],
            signal or "（无）",
        )

    # 6. Course avgScore 已删除，确认无该字段
    for c in COURSES:
        assert "avg_score" not in c and "avgScore" not in c, "Course 不应包含 avgScore"
    logger.info("Course 已移除 avgScore：通过")

    # 7. Letter unread -> is_read 语义取反：原始 unread=true 对应 is_read=false
    for letter in LETTERS:
        logger.info(
            "信件 %-4s title=%-12s is_read=%-5s (原 unread=%s)",
            letter["id"],
            letter["title"],
            letter["is_read"],
            not letter["is_read"],
        )

    logger.info("关键字段映射规则验证通过")


def seed(conn: sqlite3.Connection) -> None:
    init_schema(conn)
    migrate_up(conn)
    validate_mapping()

    logger.info("开始写入班级：%s %s", CLASS["class_code"], CLASS["class_name"])
    conn.execute(
        """
        INSERT OR REPLACE INTO classes (class_code, class_name, school, region_key, grade, class_no)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            CLASS["class_code"],
            CLASS["class_name"],
            CLASS["school"],
            CLASS["region_key"],
            CLASS["grade"],
            CLASS["class_no"],
        ),
    )

    logger.info("开始写入 %d 位学生", len(STUDENTS))
    for s in STUDENTS:
        conn.execute(
            """
            INSERT OR REPLACE INTO students (
                student_id, class_code, name, grade,
                student_no, ideal, avatar_seed, role
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                s["id"],
                CLASS["class_code"],
                s["name"],
                s["grade"],
                s["student_no"],
                s["ideal"],
                s["avatar_seed"],
                s["role"],
            ),
        )

    logger.info("开始写入 %d 条学情记录", len(ACADEMIC_RECORDS))
    for rec in ACADEMIC_RECORDS:
        conn.execute(
            """
            INSERT OR REPLACE INTO academic_records (student_id, scores, role, teacher_note)
            VALUES (?, ?, ?, ?)
            """,
            (
                rec["student_id"],
                json.dumps(rec["scores"], ensure_ascii=False),
                rec["role"],
                rec["teacher_note"],
            ),
        )

    logger.info("开始写入 %d 条成长记录", len(GROWTH_RECORDS))
    now = "2026-08-07T10:00:00+00:00"
    student_ideals = {s["id"]: s["ideal"] for s in STUDENTS}
    for rec in GROWTH_RECORDS:
        growth_value = rec["growth_value"]
        state = rec["state"]
        cheer_until = None
        if state == "cheer":
            cheer_until = "2026-08-10T10:00:00+00:00"
        conn.execute(
            """
            INSERT OR REPLACE INTO growth_records (
                student_id, ideal, commitments, actions, history, stage, pet_state,
                last_gist, needs_care, teacher_constraints, state, signal,
                growth_value, species, pet_stage, last_growth_at, cheer_until, portrait_url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rec["student_id"],
                student_ideals.get(rec["student_id"]),
                json.dumps(rec.get("commitments", []), ensure_ascii=False),
                json.dumps(rec.get("actions", []), ensure_ascii=False),
                json.dumps(rec.get("history", []), ensure_ascii=False),
                _stage_for(growth_value),
                None,
                rec.get("last_gist"),
                1 if rec["needs_care"] else 0,
                None,
                state,
                rec["signal"],
                growth_value,
                rec["species"],
                _pet_stage_for(growth_value),
                now,
                cheer_until,
                None,
            ),
        )

    logger.info("开始写入 %d 条课程记录", len(COURSES))
    for c in COURSES:
        conn.execute(
            """
            INSERT OR REPLACE INTO courses (
                course_id, class_code, topic, date,
                duration, joined, status, goal, traces
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                c["id"],
                CLASS["class_code"],
                c["topic"],
                c["date"],
                c["duration"],
                c["joined"],
                c["status"],
                c["goal"],
                c["traces"],
            ),
        )

    logger.info("开始写入 %d 封信", len(LETTERS))
    for letter in LETTERS:
        conn.execute(
            """
        INSERT OR REPLACE INTO letters (
            letter_id, student_id, title, date,
            is_read, preview, body, generated_at, source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            letter["id"],
            letter["student_id"],
            letter["title"],
            letter["date"],
            1 if letter["is_read"] else 0,
            letter["preview"],
            json.dumps(letter["body"], ensure_ascii=False),
            letter["generated_at"],
            letter["source"],
        ),
        )

    conn.commit()
    logger.info("数据库写入完成")


def verify(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM classes")
    (class_count,) = cur.fetchone()
    cur.execute("SELECT COUNT(*) FROM students")
    (student_count,) = cur.fetchone()
    cur.execute("SELECT COUNT(*) FROM academic_records")
    (academic_count,) = cur.fetchone()
    cur.execute("SELECT COUNT(*) FROM growth_records")
    (growth_count,) = cur.fetchone()
    cur.execute("SELECT COUNT(*) FROM courses")
    (course_count,) = cur.fetchone()
    cur.execute("SELECT COUNT(*) FROM letters")
    (letter_count,) = cur.fetchone()

    logger.info("classes: %d", class_count)
    logger.info("students: %d", student_count)
    logger.info("academic_records: %d", academic_count)
    logger.info("growth_records: %d", growth_count)
    logger.info("courses: %d", course_count)
    logger.info("letters: %d", letter_count)

    assert class_count == 1, "应只有 1 个班级"
    assert student_count == 8, "应有 8 个学生"
    assert academic_count == 8, "应有 8 条学情记录"
    assert growth_count == 8, "应有 8 条成长记录"
    assert course_count == 4, "应有 4 条课程记录"
    assert letter_count == 3, "应有 3 封信"


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed demo data for 小信")
    parser.add_argument("--fresh", action="store_true", help="清空表后重新 seed（已默认启用）")
    parser.add_argument(
        "db_path",
        nargs="?",
        default=str(Path(__file__).resolve().parent.parent / "data" / "demo.db"),
        help="SQLite 数据库路径（默认 <repo>/server/data/demo.db）",
    )
    args = parser.parse_args()

    db_path = Path(args.db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    try:
        init_schema(conn)
        migrate_up(conn)
        clear_tables(conn)
        seed(conn)
        verify(conn)
    finally:
        conn.close()

    logger.info("Seed 完成：%s", db_path.resolve())


if __name__ == "__main__":
    main()
