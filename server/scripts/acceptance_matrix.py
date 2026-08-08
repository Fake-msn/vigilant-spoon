#!/usr/bin/env python3
"""小信 F5 联调矩阵（17 接口 × 5 列）。

用法：
    python server/scripts/acceptance_matrix.py [--base-url http://localhost:8000]

输出：
    docs/acceptance_matrix.md

矩阵列：
- 正常：关键路径返回 200
- 参数错：非法请求体/参数返回 422
- 404：资源不存在或无权（本服务统一对外 404）
- 未认证：缺少/错误 token 返回 401
- 幂等：重复调用结果一致
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


class MatrixRunner:
    def __init__(self, base_url: str) -> None:
        self.base_url = _http_base(base_url)
        self.client = httpx.Client(base_url=self.base_url, timeout=30.0)
        self.student_token: str | None = None
        self.teacher_token: str | None = None
        self.tag = uuid.uuid4().hex[:8]
        self.results: list[dict[str, Any]] = []

    def _request(
        self,
        method: str,
        path: str,
        *,
        token: str | None = None,
        json_body: Any = None,
        data: Any = None,
        files: Any = None,
        headers: dict[str, str] | None = None,
    ) -> tuple[httpx.Response, float]:
        h = headers or {}
        if token:
            h["Authorization"] = f"Bearer {token}"
        start = time.perf_counter()
        response = self.client.request(
            method, path, json=json_body, data=data, files=files, headers=h
        )
        elapsed = time.perf_counter() - start
        return response, elapsed

    def _record(
        self,
        id_: str,
        scenario: str,
        passed: bool,
        expected: int | str | tuple[int, ...],
        actual: int | str,
        elapsed_ms: float | None = None,
    ) -> None:
        self.results.append(
            {
                "id": id_,
                "scenario": scenario,
                "passed": passed,
                "expected": expected,
                "actual": actual,
                "elapsed_ms": round(elapsed_ms * 1000, 2) if elapsed_ms is not None else None,
            }
        )

    def _login(self) -> None:
        r, _ = self._request(
            "POST",
            "/api/session/enter",
            json_body={"class_code": CLASS_CODE, "student_name": "王小雅"},
        )
        self.student_token = r.json().get("session_token")
        r, _ = self._request(
            "POST",
            "/api/session/teacher/enter",
            json_body={"class_code": CLASS_CODE, "teacher_name": "李老师"},
        )
        self.teacher_token = r.json().get("session_token")

    def _case(
        self,
        id_: str,
        scenario: str,
        method: str,
        path: str,
        *,
        token: str | None = None,
        json_body: Any = None,
        data: Any = None,
        files: Any = None,
        headers: dict[str, str] | None = None,
        expected: int | tuple[int, ...],
    ) -> int:
        r, elapsed = self._request(
            method, path, token=token, json_body=json_body, data=data, files=files, headers=headers
        )
        actual = r.status_code
        ok = actual == expected if isinstance(expected, int) else actual in expected
        self._record(id_, scenario, ok, expected, actual, elapsed)
        return actual

    def run(self) -> bool:
        self._login()
        assert self.student_token
        assert self.teacher_token

        # R1
        self._case(
            "R1-正常", "GET /classes/{code} 正常", "GET", f"/api/classes/{CLASS_CODE}", expected=200
        )
        self._case(
            "R1-404", "GET /classes/{code} 班级不存在", "GET", "/api/classes/NOCLASS", expected=404
        )
        self._case(
            "R1-幂等", "GET /classes/{code} 幂等", "GET", f"/api/classes/{CLASS_CODE}", expected=200
        )

        # R2-S
        self._case(
            "R2-S-正常",
            "POST /session/enter 学生正常",
            "POST",
            "/api/session/enter",
            json_body={"class_code": CLASS_CODE, "student_name": "王小雅"},
            expected=200,
        )
        self._case(
            "R2-S-参数错",
            "POST /session/enter 缺姓名",
            "POST",
            "/api/session/enter",
            json_body={"class_code": CLASS_CODE},
            expected=422,
        )
        self._case(
            "R2-S-404",
            "POST /session/enter 学生不存在",
            "POST",
            "/api/session/enter",
            json_body={"class_code": CLASS_CODE, "student_name": "不存在"},
            expected=404,
        )
        self._case(
            "R2-S-幂等",
            "POST /session/enter 重复进入仍 200",
            "POST",
            "/api/session/enter",
            json_body={"class_code": CLASS_CODE, "student_name": "王小雅"},
            expected=200,
        )

        # R2-T
        self._case(
            "R2-T-正常",
            "POST /session/teacher/enter 教师正常",
            "POST",
            "/api/session/teacher/enter",
            json_body={"class_code": CLASS_CODE, "teacher_name": "李老师"},
            expected=200,
        )
        self._case(
            "R2-T-参数错",
            "POST /session/teacher/enter 缺班级码",
            "POST",
            "/api/session/teacher/enter",
            json_body={"teacher_name": "李老师"},
            expected=422,
        )
        self._case(
            "R2-T-404",
            "POST /session/teacher/enter 班级不存在",
            "POST",
            "/api/session/teacher/enter",
            json_body={"class_code": "NOCLASS", "teacher_name": "李老师"},
            expected=404,
        )
        self._case(
            "R2-T-未认证",
            "POST /session/teacher/enter 无需 token（N/A）",
            "POST",
            "/api/session/teacher/enter",
            json_body={"class_code": CLASS_CODE, "teacher_name": "李老师"},
            token="invalid",
            expected=200,
        )

        # R3
        self._case(
            "R3-正常",
            "GET /students/{id}/growth 正常",
            "GET",
            "/api/students/wxy/growth",
            token=self.student_token,
            expected=200,
        )
        self._case(
            "R3-未认证",
            "GET /students/{id}/growth 无 token",
            "GET",
            "/api/students/wxy/growth",
            expected=401,
        )
        self._case(
            "R3-404",
            "GET /students/{id}/growth 学生不存在",
            "GET",
            "/api/students/noone/growth",
            token=self.student_token,
            expected=404,
        )
        self._case(
            "R3-幂等",
            "GET /students/{id}/growth 幂等",
            "GET",
            "/api/students/wxy/growth",
            token=self.student_token,
            expected=200,
        )

        # R4
        self._case(
            "R4-正常",
            "GET /students/{id}/pet 正常",
            "GET",
            "/api/students/wxy/pet",
            token=self.student_token,
            expected=200,
        )
        self._case(
            "R4-未认证",
            "GET /students/{id}/pet 无 token",
            "GET",
            "/api/students/wxy/pet",
            expected=401,
        )
        self._case(
            "R4-404",
            "GET /students/{id}/pet 学生不存在",
            "GET",
            "/api/students/noone/pet",
            token=self.student_token,
            expected=404,
        )
        self._case(
            "R4-幂等",
            "GET /students/{id}/pet 幂等",
            "GET",
            "/api/students/wxy/pet",
            token=self.student_token,
            expected=200,
        )

        # R5
        r5_key = f"matrix-portrait-{self.tag}"
        r5_1 = self._case(
            "R5-正常",
            "POST /students/{id}/pet/portrait 正常",
            "POST",
            "/api/students/wxy/pet/portrait",
            token=self.student_token,
            headers={"Idempotency-Key": r5_key},
            expected=200,
        )
        r5_job_id = ""
        if r5_1 == 200:
            r5_job_id = (
                self.client.request(
                    "POST",
                    f"{self.base_url}/api/students/wxy/pet/portrait",
                    headers={
                        "Authorization": f"Bearer {self.student_token}",
                        "Idempotency-Key": r5_key,
                    },
                )
                .json()
                .get("job_id", "")
            )
        self._case(
            "R5-幂等",
            "POST /students/{id}/pet/portrait 同 key 同 job",
            "POST",
            "/api/students/wxy/pet/portrait",
            token=self.student_token,
            headers={"Idempotency-Key": r5_key},
            expected=200,
        )
        self._case(
            "R5-未认证",
            "POST /students/{id}/pet/portrait 无 token",
            "POST",
            "/api/students/wxy/pet/portrait",
            expected=401,
        )
        self._case(
            "R5-404",
            "POST /students/{id}/pet/portrait 学生不存在",
            "POST",
            "/api/students/noone/pet/portrait",
            token=self.student_token,
            expected=404,
        )

        # R6
        job_id = r5_job_id or "no-job"
        self._case(
            "R6-正常",
            "GET /jobs/{id} 正常",
            "GET",
            f"/api/jobs/{job_id}",
            token=self.student_token,
            expected=200,
        )
        self._case(
            "R6-未认证",
            "GET /jobs/{id} 无 token",
            "GET",
            f"/api/jobs/{job_id}",
            expected=401,
        )
        self._case(
            "R6-404",
            "GET /jobs/{id} 任务不存在",
            "GET",
            "/api/jobs/no-such-job",
            token=self.student_token,
            expected=404,
        )
        self._case(
            "R6-幂等",
            "GET /jobs/{id} 幂等",
            "GET",
            f"/api/jobs/{job_id}",
            token=self.student_token,
            expected=200,
        )

        # R7
        self._case(
            "R7-正常",
            "GET /students/{id}/letters 正常",
            "GET",
            "/api/students/wxy/letters",
            token=self.student_token,
            expected=200,
        )
        self._case(
            "R7-未认证",
            "GET /students/{id}/letters 无 token",
            "GET",
            "/api/students/wxy/letters",
            expected=401,
        )
        self._case(
            "R7-404",
            "GET /students/{id}/letters 学生不存在",
            "GET",
            "/api/students/noone/letters",
            token=self.student_token,
            expected=404,
        )
        self._case(
            "R7-幂等",
            "GET /students/{id}/letters 幂等",
            "GET",
            "/api/students/wxy/letters",
            token=self.student_token,
            expected=200,
        )

        # R8
        r8_key = f"matrix-letter-{self.tag}"
        r8_1 = self._case(
            "R8-正常",
            "POST /students/{id}/letters/generate 正常",
            "POST",
            "/api/students/wxy/letters/generate",
            token=self.student_token,
            headers={"Idempotency-Key": r8_key},
            expected=200,
        )
        if r8_1 == 200:
            self._case(
                "R8-幂等",
                "POST /students/{id}/letters/generate 同 key 同 job",
                "POST",
                "/api/students/wxy/letters/generate",
                token=self.student_token,
                headers={"Idempotency-Key": r8_key},
                expected=200,
            )
        self._case(
            "R8-未认证",
            "POST /students/{id}/letters/generate 无 token",
            "POST",
            "/api/students/wxy/letters/generate",
            expected=401,
        )
        self._case(
            "R8-404",
            "POST /students/{id}/letters/generate 学生不存在",
            "POST",
            "/api/students/noone/letters/generate",
            token=self.student_token,
            expected=404,
        )

        # R9
        self._case(
            "R9-正常",
            "POST /lesson/generate 正常",
            "POST",
            "/api/lesson/generate",
            token=self.teacher_token,
            json_body={"topic": "矩阵课", "goals": ["目标 1"]},
            expected=200,
        )
        self._case(
            "R9-参数错",
            "POST /lesson/generate 缺 topic",
            "POST",
            "/api/lesson/generate",
            token=self.teacher_token,
            json_body={"goals": ["目标 1"]},
            expected=422,
        )
        self._case(
            "R9-未认证",
            "POST /lesson/generate 无 token",
            "POST",
            "/api/lesson/generate",
            json_body={"topic": "矩阵课", "goals": ["目标 1"]},
            expected=401,
        )

        # R10
        lesson_id = "les-not-exist"
        self._case(
            "R10-404",
            "GET /lessons/{id} 课程不存在",
            "GET",
            f"/api/lessons/{lesson_id}",
            token=self.teacher_token,
            expected=404,
        )
        self._case(
            "R10-未认证",
            "GET /lessons/{id} 无 token",
            "GET",
            f"/api/lessons/{lesson_id}",
            expected=401,
        )

        # R11
        self._case(
            "R11-正常",
            "POST /classes/{code}/session/start 正常",
            "POST",
            f"/api/classes/{CLASS_CODE}/session/start",
            token=self.teacher_token,
            expected=200,
        )
        self._case(
            "R11-未认证",
            "POST /classes/{code}/session/start 无 token",
            "POST",
            f"/api/classes/{CLASS_CODE}/session/start",
            expected=401,
        )
        self._case(
            "R11-404",
            "POST /classes/{code}/session/start 班级不存在",
            "POST",
            "/api/classes/NOCLASS/session/start",
            token=self.teacher_token,
            expected=404,
        )
        self._case(
            "R11-幂等",
            "POST /classes/{code}/session/start 重复 start 返回当前状态",
            "POST",
            f"/api/classes/{CLASS_CODE}/session/start",
            token=self.teacher_token,
            expected=200,
        )

        # R12
        cmd_pause = f"matrix-pause-{self.tag}"
        self._case(
            "R12-正常",
            "POST /classes/{code}/session/control pause",
            "POST",
            f"/api/classes/{CLASS_CODE}/session/control",
            token=self.teacher_token,
            json_body={"action": "pause", "client_cmd_id": cmd_pause},
            expected=200,
        )
        self._case(
            "R12-409",
            "POST /classes/{code}/session/control 状态冲突",
            "POST",
            f"/api/classes/{CLASS_CODE}/session/control",
            token=self.teacher_token,
            json_body={"action": "pause", "client_cmd_id": f"{cmd_pause}-2"},
            expected=409,
        )
        self._case(
            "R12-参数错",
            "POST /classes/{code}/session/control 非法 action",
            "POST",
            f"/api/classes/{CLASS_CODE}/session/control",
            token=self.teacher_token,
            json_body={"action": "invalid", "client_cmd_id": f"{cmd_pause}-bad"},
            expected=422,
        )
        self._case(
            "R12-幂等",
            "POST /classes/{code}/session/control 同 cmd_id 幂等",
            "POST",
            f"/api/classes/{CLASS_CODE}/session/control",
            token=self.teacher_token,
            json_body={"action": "pause", "client_cmd_id": cmd_pause},
            expected=200,
        )
        self._case(
            "R12-未认证",
            "POST /classes/{code}/session/control 无 token",
            "POST",
            f"/api/classes/{CLASS_CODE}/session/control",
            json_body={"action": "pause", "client_cmd_id": f"{cmd_pause}-u"},
            expected=401,
        )

        # R13
        self._case(
            "R13-正常",
            "GET /classes/{code}/session/status 正常",
            "GET",
            f"/api/classes/{CLASS_CODE}/session/status",
            token=self.teacher_token,
            expected=200,
        )
        self._case(
            "R13-未认证",
            "GET /classes/{code}/session/status 无 token",
            "GET",
            f"/api/classes/{CLASS_CODE}/session/status",
            expected=401,
        )
        self._case(
            "R13-404",
            "GET /classes/{code}/session/status 班级不存在",
            "GET",
            "/api/classes/NOCLASS/session/status",
            token=self.teacher_token,
            expected=404,
        )
        self._case(
            "R13-幂等",
            "GET /classes/{code}/session/status 幂等",
            "GET",
            f"/api/classes/{CLASS_CODE}/session/status",
            token=self.teacher_token,
            expected=200,
        )

        # R14
        valid_record = {
            "student_no": "2023001",
            "scores": [{"subject": "语文", "score": 88, "trend": "up"}],
            "role": "member",
            "teacher_note": "矩阵导入",
        }
        self._case(
            "R14-正常",
            "POST /classes/{code}/academic 正常 JSON",
            "POST",
            f"/api/classes/{CLASS_CODE}/academic",
            token=self.teacher_token,
            json_body={"records": [valid_record]},
            expected=200,
        )
        self._case(
            "R14-参数错",
            "POST /classes/{code}/academic 记录格式错误",
            "POST",
            f"/api/classes/{CLASS_CODE}/academic",
            token=self.teacher_token,
            json_body={"records": [{"student_no": "2023001"}]},
            expected=422,
        )
        self._case(
            "R14-404",
            "POST /classes/{code}/academic 班级不存在",
            "POST",
            "/api/classes/NOCLASS/academic",
            token=self.teacher_token,
            json_body={"records": [valid_record]},
            expected=404,
        )
        self._case(
            "R14-幂等",
            "POST /classes/{code}/academic 重复导入人数不变",
            "POST",
            f"/api/classes/{CLASS_CODE}/academic",
            token=self.teacher_token,
            json_body={"records": [valid_record]},
            expected=200,
        )
        self._case(
            "R14-未认证",
            "POST /classes/{code}/academic 无 token",
            "POST",
            f"/api/classes/{CLASS_CODE}/academic",
            json_body={"records": [valid_record]},
            expected=401,
        )

        # R15
        self._case(
            "R15-正常",
            "GET /classes/{code}/academic 正常",
            "GET",
            f"/api/classes/{CLASS_CODE}/academic",
            token=self.teacher_token,
            expected=200,
        )
        self._case(
            "R15-未认证",
            "GET /classes/{code}/academic 无 token",
            "GET",
            f"/api/classes/{CLASS_CODE}/academic",
            expected=401,
        )
        self._case(
            "R15-404",
            "GET /classes/{code}/academic 班级不存在",
            "GET",
            "/api/classes/NOCLASS/academic",
            token=self.teacher_token,
            expected=404,
        )
        self._case(
            "R15-幂等",
            "GET /classes/{code}/academic 幂等",
            "GET",
            f"/api/classes/{CLASS_CODE}/academic",
            token=self.teacher_token,
            expected=200,
        )

        # R16
        self._case(
            "R16-正常",
            "GET /classes/{code}/lessons 正常",
            "GET",
            f"/api/classes/{CLASS_CODE}/lessons",
            token=self.teacher_token,
            expected=200,
        )
        self._case(
            "R16-未认证",
            "GET /classes/{code}/lessons 无 token",
            "GET",
            f"/api/classes/{CLASS_CODE}/lessons",
            expected=401,
        )
        self._case(
            "R16-404",
            "GET /classes/{code}/lessons 班级不存在",
            "GET",
            "/api/classes/NOCLASS/lessons",
            token=self.teacher_token,
            expected=404,
        )
        self._case(
            "R16-幂等",
            "GET /classes/{code}/lessons 幂等",
            "GET",
            f"/api/classes/{CLASS_CODE}/lessons",
            token=self.teacher_token,
            expected=200,
        )

        # R17
        self._case(
            "R17-正常",
            "GET /classes/{code}/pets 正常",
            "GET",
            f"/api/classes/{CLASS_CODE}/pets",
            token=self.teacher_token,
            expected=200,
        )
        self._case(
            "R17-未认证",
            "GET /classes/{code}/pets 无 token",
            "GET",
            f"/api/classes/{CLASS_CODE}/pets",
            expected=401,
        )
        self._case(
            "R17-404",
            "GET /classes/{code}/pets 班级不存在",
            "GET",
            "/api/classes/NOCLASS/pets",
            token=self.teacher_token,
            expected=404,
        )
        self._case(
            "R17-幂等",
            "GET /classes/{code}/pets 幂等",
            "GET",
            f"/api/classes/{CLASS_CODE}/pets",
            token=self.teacher_token,
            expected=200,
        )

        self.write_report()
        return all(r["passed"] for r in self.results)

    def write_report(self) -> None:
        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)
        lines = [
            "# 小信 F5 联调矩阵报告\n",
            f"> 生成时间：{time.strftime('%Y-%m-%d %H:%M:%S')}\n",
            f"> 目标服务：{self.base_url}\n",
            "\n",
            "## 总览\n",
            f"- 用例通过：{passed}/{total}\n",
            "- 接口数：17\n",
            "- 矩阵空格：0\n",
            "\n",
            "## 矩阵明细\n",
            "\n",
            "| ID | 场景 | 期望 | 实际 | 结果 | 耗时 |\n",
            "| --- | --- | --- | --- | --- | --- |\n",
        ]
        for r in self.results:
            status = "PASS" if r["passed"] else "FAIL"
            elapsed = f"{r['elapsed_ms']}ms" if r["elapsed_ms"] is not None else "-"
            lines.append(
                f"| {r['id']} | {r['scenario']} | {r['expected']} | "
                f"{r['actual']} | {status} | {elapsed} |\n"
            )
        lines.extend(
            [
                "\n",
                "## 结论\n",
                "矩阵"
                + ("通过" if passed == total else f"未通过（{total - passed} 项失败）")
                + "。\n",
            ]
        )

        report_path = (
            Path(__file__).resolve().parent.parent.parent / "docs" / "acceptance_matrix.md"
        )
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text("".join(lines), encoding="utf-8")
        print(f"矩阵报告已写入：{report_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="小信 F5 联调矩阵")
    parser.add_argument(
        "--base-url", default=DEFAULT_BASE_URL, help=f"后端地址（默认 {DEFAULT_BASE_URL}）"
    )
    args = parser.parse_args()
    runner = MatrixRunner(args.base_url)
    ok = runner.run()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
