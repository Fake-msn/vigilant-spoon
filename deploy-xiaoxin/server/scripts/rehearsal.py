#!/usr/bin/env python3
"""小信 F5 双线彩排脚本。

用法：
    python server/scripts/rehearsal.py [--base-url http://localhost:8000]

输出：
    docs/rehearsal.md

流程：
- 学生线：登录 → 班级信息 → 成长档案（确定性字段）→ 宠物状态 → 信件列表 →
          触发信件/生图 job → 成长档案二次确认
- 教师线：登录 → 班级宠物墙 → 学情汇总 → 学情导入 → 课程列表 → 生成备课方案 →
          启动课堂 → 暂停/恢复 → 课堂状态
"""

from __future__ import annotations

import argparse
import sys
import time
import uuid
from pathlib import Path
from typing import Any

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.seed import CLASS

CLASS_CODE = CLASS["class_code"]
DEFAULT_BASE_URL = "http://localhost:8000"


def _http_base(base_url: str) -> str:
    return base_url.rstrip("/")


class RehearsalRunner:
    def __init__(self, base_url: str) -> None:
        self.base_url = _http_base(base_url)
        self.client = httpx.Client(base_url=self.base_url, timeout=30.0)
        self.student_token: str | None = None
        self.teacher_token: str | None = None
        self.run_tag = uuid.uuid4().hex[:8]
        self.results: list[dict[str, Any]] = []

    def _request(
        self,
        method: str,
        path: str,
        *,
        token: str | None = None,
        json_body: Any = None,
        headers: dict[str, str] | None = None,
    ) -> tuple[httpx.Response, float]:
        h = headers or {}
        if token:
            h["Authorization"] = f"Bearer {token}"
        start = time.perf_counter()
        response = self.client.request(method, path, json=json_body, headers=h)
        elapsed = time.perf_counter() - start
        return response, elapsed

    def _record(
        self,
        line: str,
        step: str,
        passed: bool,
        elapsed: float | None = None,
        detail: str = "",
    ) -> None:
        self.results.append(
            {
                "line": line,
                "step": step,
                "passed": passed,
                "elapsed_ms": round(elapsed * 1000, 2) if elapsed is not None else None,
                "detail": detail,
            }
        )
        status = "PASS" if passed else "BLOCK"
        elapsed_str = f" {self.results[-1]['elapsed_ms']}ms" if elapsed is not None else ""
        print(f"[{status}] {line}/{step}{elapsed_str}{' - ' + detail if detail else ''}")

    def _login(self, line: str, student: bool) -> None:
        if student:
            r, elapsed = self._request(
                "POST",
                "/api/session/enter",
                json_body={"class_code": CLASS_CODE, "student_name": "王小雅"},
            )
            self.student_token = r.json().get("session_token")
            ok = bool(
                r.status_code == 200 and self.student_token and self.student_token.startswith("st_")
            )
            self._record(line, "登录（王小雅）", ok, elapsed)
            return
        r, elapsed = self._request(
            "POST",
            "/api/session/teacher/enter",
            json_body={"class_code": CLASS_CODE, "teacher_name": "李老师"},
        )
        self.teacher_token = r.json().get("session_token")
        ok = bool(
            r.status_code == 200 and self.teacher_token and self.teacher_token.startswith("st_")
        )
        self._record(line, "登录（李老师）", ok, elapsed)

    def student_line(self) -> None:
        line = "学生线"
        self._login(line, student=True)
        assert self.student_token

        # R1
        r, elapsed = self._request("GET", f"/api/classes/{CLASS_CODE}", token=self.student_token)
        data = r.json()
        ok = r.status_code == 200 and data.get("class_code") == CLASS_CODE
        self._record(line, "查看班级信息", ok, elapsed, f"students={len(data.get('students', []))}")

        # R3 成长档案：只走确定性字段
        r, elapsed = self._request(
            "GET", "/api/students/wxy/growth?view=full", token=self.student_token
        )
        data = r.json()
        ideal = data.get("ideal")
        commitments = data.get("commitments") or []
        actions = data.get("actions") or []
        ok = (
            r.status_code == 200
            and ideal == "蛋糕师"
            and len(commitments) >= 1
            and len(actions) >= 1
            and "scores" not in data
        )
        self._record(
            line,
            "成长档案（确定性字段）",
            ok,
            elapsed,
            f"ideal={ideal}, commitments={len(commitments)}, actions={len(actions)}",
        )

        # R4 宠物状态
        r, elapsed = self._request("GET", "/api/students/wxy/pet", token=self.student_token)
        data = r.json()
        ok = r.status_code == 200 and data.get("state") in ("daily", "gray", "cheer")
        self._record(line, "查看电子宠物", ok, elapsed, f"state={data.get('state')}")

        # R7 信件
        r, elapsed = self._request("GET", "/api/students/wxy/letters", token=self.student_token)
        data = r.json()
        ok = r.status_code == 200 and isinstance(data, list) and len(data) >= 3
        self._record(line, "查看信箱", ok, elapsed, f"letters={len(data)}")

        # R8 触发一封信
        r, elapsed = self._request(
            "POST",
            "/api/students/wxy/letters/generate",
            token=self.student_token,
            headers={"Idempotency-Key": f"rehearsal-letter-{self.run_tag}"},
        )
        job_id = r.json().get("job_id") if r.status_code == 200 else None
        ok = r.status_code == 200 and bool(job_id)
        self._record(line, "触发本周来信", ok, elapsed, f"job={job_id}")
        if job_id:
            status = self._poll_job(job_id, self.student_token)
            self._record(line, "信件生成完成", status == "done", detail=f"status={status}")

        # R5 生图
        r, elapsed = self._request(
            "POST",
            "/api/students/wxy/pet/portrait",
            token=self.student_token,
            headers={"Idempotency-Key": f"rehearsal-portrait-{self.run_tag}"},
        )
        job_id = r.json().get("job_id") if r.status_code == 200 else None
        ok = r.status_code == 200 and bool(job_id)
        self._record(line, "生成梦想画像", ok, elapsed, f"job={job_id}")
        if job_id:
            status = self._poll_job(job_id, self.student_token)
            self._record(line, "画像生成完成", status == "done", detail=f"status={status}")

    def teacher_line(self) -> None:
        line = "教师线"
        self._login(line, student=False)
        assert self.teacher_token

        # R17 班级宠物墙
        r, elapsed = self._request(
            "GET", f"/api/classes/{CLASS_CODE}/pets", token=self.teacher_token
        )
        data = r.json()
        ok = r.status_code == 200 and len(data) == 8
        gray_first = (data[0].get("pet") or {}).get("state") == "gray" if data else False
        self._record(line, "班级宠物墙", ok, elapsed, f"count={len(data)}, gray_top={gray_first}")

        # R15 学情汇总
        r, elapsed = self._request(
            "GET", f"/api/classes/{CLASS_CODE}/academic", token=self.teacher_token
        )
        data = r.json()
        records = data.get("records") or []
        ok = r.status_code == 200 and len(records) == 8
        self._record(line, "学情汇总", ok, elapsed, f"records={len(records)}")

        # R14 导入一条学情（幂等）
        record = {
            "student_no": "2023001",
            "name": "王小雅",
            "scores": [
                {"subject": "语文", "score": 88, "trend": "up"},
                {"subject": "数学", "score": 76, "trend": "down"},
                {"subject": "英语", "score": 82, "trend": "flat"},
            ],
            "role": "member",
            "teacher_note": "彩排导入",
        }
        r, elapsed = self._request(
            "POST",
            f"/api/classes/{CLASS_CODE}/academic",
            token=self.teacher_token,
            json_body={"records": [record]},
        )
        ok = r.status_code == 200
        self._record(line, "学情导入", ok, elapsed)

        # R16 课程列表
        r, elapsed = self._request(
            "GET", f"/api/classes/{CLASS_CODE}/lessons", token=self.teacher_token
        )
        data = r.json()
        ok = r.status_code == 200 and isinstance(data, list)
        self._record(line, "我的课程", ok, elapsed, f"count={len(data)}")

        # R9/R10 备课生成
        r, elapsed = self._request(
            "POST",
            "/api/lesson/generate",
            token=self.teacher_token,
            json_body={
                "topic": "彩排课：我的梦想",
                "goals": ["每位同学说出一个具体理想", "记录一件本周能做到的小事"],
                "guidance": "围绕梦想主题，引导学生说出具体职业并关联日常行动",
            },
        )
        lesson_id = r.json().get("lesson_id") if r.status_code == 200 else None
        ok = r.status_code == 200 and bool(lesson_id)
        self._record(line, "生成备课方案", ok, elapsed, f"lesson={lesson_id}")
        if lesson_id:
            r, elapsed = self._request("GET", f"/api/lessons/{lesson_id}", token=self.teacher_token)
            ok = r.status_code == 200 and r.json().get("lesson_id") == lesson_id
            self._record(line, "查看备课方案", ok, elapsed)

        # R11 启动课堂（兼容前面脚本遗留的 paused 态）
        r, elapsed = self._request(
            "POST", f"/api/classes/{CLASS_CODE}/session/start", token=self.teacher_token
        )
        data = r.json()
        state = data.get("state")
        if r.status_code == 200 and state == "paused":
            r, _ = self._request(
                "POST",
                f"/api/classes/{CLASS_CODE}/session/control",
                token=self.teacher_token,
                json_body={
                    "action": "resume",
                    "client_cmd_id": f"rehearsal-pre-resume-{self.run_tag}",
                },
            )
            data = r.json()
            state = data.get("state")
        ok = r.status_code == 200 and state == "active"
        self._record(line, "启动课堂", ok, elapsed, f"state={state}")

        # R12 暂停
        r, elapsed = self._request(
            "POST",
            f"/api/classes/{CLASS_CODE}/session/control",
            token=self.teacher_token,
            json_body={"action": "pause", "client_cmd_id": f"rehearsal-pause-{self.run_tag}"},
        )
        data = r.json()
        ok = r.status_code == 200 and data.get("state") == "paused"
        self._record(line, "暂停课堂", ok, elapsed, f"state={data.get('state')}")

        # R13 状态确认
        r, elapsed = self._request(
            "GET", f"/api/classes/{CLASS_CODE}/session/status", token=self.teacher_token
        )
        data = r.json()
        ok = r.status_code == 200 and data.get("state") == "paused"
        self._record(line, "确认课堂状态", ok, elapsed, f"state={data.get('state')}")

        # 恢复，避免影响后续演示
        r, _ = self._request(
            "POST",
            f"/api/classes/{CLASS_CODE}/session/control",
            token=self.teacher_token,
            json_body={"action": "resume", "client_cmd_id": f"rehearsal-resume-{self.run_tag}"},
        )
        self._record(line, "恢复课堂", r.status_code == 200)

    def _poll_job(self, job_id: str, token: str) -> str:
        status = "pending"
        for _ in range(30):
            r, _ = self._request("GET", f"/api/jobs/{job_id}", token=token)
            status = r.json().get("status", "pending")
            if status in ("done", "failed"):
                break
            time.sleep(0.5)
        return status

    def run(self) -> bool:
        self.student_line()
        self.teacher_line()
        self.write_report()
        return all(r["passed"] for r in self.results)

    def write_report(self) -> None:
        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)
        lines = [
            "# 小信 F5 双线彩排报告\n",
            f"> 生成时间：{time.strftime('%Y-%m-%d %H:%M:%S')}\n",
            f"> 目标服务：{self.base_url}\n",
            "\n",
            "## 总览\n",
            f"- 步骤通过：{passed}/{total}\n",
            f"- 学生线步骤：{sum(1 for r in self.results if r['line'] == '学生线')}\n",
            f"- 教师线步骤：{sum(1 for r in self.results if r['line'] == '教师线')}\n",
            "\n",
            "## 彩排明细\n",
            "\n",
            "| 线路 | 步骤 | 结果 | 耗时 | 详情 |\n",
            "| --- | --- | --- | --- | --- |\n",
        ]
        for r in self.results:
            status = "PASS" if r["passed"] else "BLOCK"
            elapsed = f"{r['elapsed_ms']}ms" if r["elapsed_ms"] is not None else "-"
            lines.append(f"| {r['line']} | {r['step']} | {status} | {elapsed} | {r['detail']} |\n")
        lines.extend(
            [
                "\n",
                "## 结论\n",
                "彩排"
                + ("无阻断" if passed == total else f"存在 {total - passed} 处阻断")
                + "。\n",
            ]
        )

        report_path = Path(__file__).resolve().parent.parent.parent / "docs" / "rehearsal.md"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text("".join(lines), encoding="utf-8")
        print(f"彩排报告已写入：{report_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="小信 F5 双线彩排")
    parser.add_argument(
        "--base-url", default=DEFAULT_BASE_URL, help=f"后端地址（默认 {DEFAULT_BASE_URL}）"
    )
    args = parser.parse_args()
    runner = RehearsalRunner(args.base_url)
    ok = runner.run()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
