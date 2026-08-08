#!/usr/bin/env python3
"""小信 F5 联调验收脚本。

用法：
    python server/scripts/acceptance.py [--base-url http://localhost:8000]

输出：
    docs/acceptance.md

覆盖：
- 17 条接口 R1-R17 关键路径 smoke test
- 语音首响 P50（本地 provider 从连接到首条 transcript）
- 生图耗时（R5 → R6 轮询）
- 信件生成触发（R8 → R6 轮询）
- 关键字段引用断言（10 项）
- 学情导入幂等（R14 双次导入）
- 课堂状态机迁移（R11/R12/R13）
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import statistics
import sys
import time
import uuid
from pathlib import Path
from typing import Any

import httpx
import websockets

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.seed import CLASS

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("acceptance")

DEFAULT_BASE_URL = "http://localhost:8000"
WS_BASE_URL = "ws://localhost:8000"
CLASS_CODE = CLASS["class_code"]


async def _ws_probe(uri: str) -> tuple[float | None, float | None]:
    """测量从 session_started 到首条 transcript/audio_chunk 的延迟。"""
    start_at: float | None = None
    first_at: float | None = None
    async with websockets.connect(uri, close_timeout=5) as ws:
        while True:
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
                data = json.loads(msg)
                if data.get("type") == "session_started" and start_at is None:
                    start_at = time.perf_counter()
                if (
                    data.get("type") in ("transcript", "audio_chunk")
                    and start_at is not None
                    and first_at is None
                ):
                    first_at = time.perf_counter()
                    break
            except asyncio.TimeoutError:
                break
    return start_at, first_at


def _http_base(base_url: str) -> str:
    return base_url.rstrip("/")


def _ws_base(base_url: str) -> str:
    return base_url.replace("http://", "ws://").replace("https://", "wss://").rstrip("/")


class AcceptanceRunner:
    def __init__(self, base_url: str) -> None:
        self.base_url = _http_base(base_url)
        self.ws_base = _ws_base(base_url)
        self.client = httpx.Client(base_url=self.base_url, timeout=30.0)
        self.student_token: str | None = None
        self.teacher_token: str | None = None
        self.lesson_id: str | None = None
        self.portrait_job_id: str | None = None
        self.letter_job_id: str | None = None
        self.run_tag = uuid.uuid4().hex[:8]
        self.results: list[dict[str, Any]] = []
        self.metrics: dict[str, Any] = {}

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
        expected_status: int | tuple[int, ...] = 200,
    ) -> tuple[httpx.Response, float]:
        h = headers or {}
        if token:
            h["Authorization"] = f"Bearer {token}"
        start = time.perf_counter()
        response = self.client.request(
            method,
            path,
            json=json_body,
            data=data,
            files=files,
            headers=h,
        )
        elapsed = time.perf_counter() - start
        status_ok = (
            response.status_code == expected_status
            if isinstance(expected_status, int)
            else response.status_code in expected_status
        )
        if not status_ok:
            logger.warning(
                "%s %s -> %s (expected %s)", method, path, response.status_code, expected_status
            )
        return response, elapsed

    def _record(
        self,
        id_: str,
        name: str,
        passed: bool,
        elapsed: float | None = None,
        detail: str = "",
    ) -> None:
        self.results.append(
            {
                "id": id_,
                "name": name,
                "passed": passed,
                "elapsed_ms": round(elapsed * 1000, 2) if elapsed is not None else None,
                "detail": detail,
            }
        )
        status = "PASS" if passed else "FAIL"
        elapsed_str = f" {self.results[-1]['elapsed_ms']}ms" if elapsed is not None else ""
        logger.info("[%s] %s%s%s", status, id_, elapsed_str, f" - {detail}" if detail else "")

    def run(self) -> bool:
        """执行全部验收用例，返回是否全部通过。"""
        self.health()
        self.r1_class_info()
        self.r2_login()
        self.r3_growth()
        self.r4_pet()
        self.r5_r6_portrait()
        self.r7_letters()
        self.r8_letter_generate()
        self.r9_r10_lesson()
        self.r11_r12_r13_classroom()
        self.r14_r15_academic()
        self.r16_lessons()
        self.r17_class_pets()
        self.ws_first_response()
        self.key_field_assertions()
        self.write_report()
        return all(r["passed"] for r in self.results)

    def health(self) -> None:
        resp, elapsed = self._request("GET", "/api/health")
        ok = resp.status_code == 200 and resp.json().get("status") == "ok"
        self._record("HEALTH", "服务健康检查", ok, elapsed)

    def r1_class_info(self) -> None:
        resp, elapsed = self._request("GET", f"/api/classes/{CLASS_CODE}")
        data = resp.json()
        ok = (
            resp.status_code == 200
            and data.get("class_code") == CLASS_CODE
            and len(data.get("students", [])) == 8
            and data.get("region_key") == CLASS["region_key"]
        )
        self._record(
            "R1", "GET /classes/{code}", ok, elapsed, f"students={len(data.get('students', []))}"
        )

    def r2_login(self) -> None:
        student_resp, elapsed_s = self._request(
            "POST",
            "/api/session/enter",
            json_body={"class_code": CLASS_CODE, "student_name": "王小雅"},
        )
        student_data = student_resp.json()
        self.student_token = student_data.get("session_token")
        ok_s = bool(
            student_resp.status_code == 200
            and self.student_token
            and self.student_token.startswith("st_")
        )
        self._record("R2-S", "POST /session/enter (学生)", ok_s, elapsed_s)

        teacher_resp, elapsed_t = self._request(
            "POST",
            "/api/session/teacher/enter",
            json_body={"class_code": CLASS_CODE, "teacher_name": "李老师"},
        )
        teacher_data = teacher_resp.json()
        self.teacher_token = teacher_data.get("session_token")
        ok_t = bool(
            teacher_resp.status_code == 200
            and self.teacher_token
            and self.teacher_token.startswith("st_")
        )
        self._record("R2-T", "POST /session/teacher/enter (教师)", ok_t, elapsed_t)

    def r3_growth(self) -> None:
        resp, elapsed = self._request(
            "GET",
            "/api/students/wxy/growth",
            token=self.student_token,
        )
        data = resp.json()
        pet = data.get("pet") or {}
        ok = (
            resp.status_code == 200
            and "scores" not in data  # light 视图禁评分
            and data.get("stage") in ("egg", "sprout", "bud", "bloom")
            and pet.get("state") in ("daily", "gray", "cheer")
        )
        self._record(
            "R3",
            "GET /students/{id}/growth",
            ok,
            elapsed,
            f"stage={data.get('stage')}, pet_state={pet.get('state')}",
        )

    def r4_pet(self) -> None:
        resp, elapsed = self._request(
            "GET",
            "/api/students/wxy/pet",
            token=self.student_token,
        )
        data = resp.json()
        ok = resp.status_code == 200 and data.get("state") in ("daily", "gray", "cheer")
        self._record("R4", "GET /students/{id}/pet", ok, elapsed, f"state={data.get('state')}")

    def r5_r6_portrait(self) -> None:
        resp, elapsed = self._request(
            "POST",
            "/api/students/wxy/pet/portrait",
            token=self.student_token,
            headers={"Idempotency-Key": f"acceptance-portrait-{self.run_tag}"},
        )
        data = resp.json()
        self.portrait_job_id = data.get("job_id")
        ok = bool(resp.status_code == 200 and self.portrait_job_id)
        self._record(
            "R5", "POST /students/{id}/pet/portrait", ok, elapsed, f"job={self.portrait_job_id}"
        )
        if not self.portrait_job_id:
            return

        start_poll = time.perf_counter()
        status = "pending"
        for _ in range(30):
            resp, _ = self._request(
                "GET", f"/api/jobs/{self.portrait_job_id}", token=self.student_token
            )
            job = resp.json()
            status = job.get("status")
            if status in ("done", "failed"):
                break
            time.sleep(0.5)
        elapsed_poll = time.perf_counter() - start_poll
        ok = status == "done"
        self._record("R6-P", "GET /jobs/{id} 生图轮询", ok, elapsed_poll, f"status={status}")
        self.metrics["portrait_elapsed_s"] = round(elapsed_poll, 2)

    def r7_letters(self) -> None:
        resp, elapsed = self._request(
            "GET",
            "/api/students/wxy/letters",
            token=self.student_token,
        )
        data = resp.json()
        ok = resp.status_code == 200 and isinstance(data, list) and len(data) >= 3
        self._record("R7", "GET /students/{id}/letters", ok, elapsed, f"count={len(data)}")

    def r8_letter_generate(self) -> None:
        resp, elapsed = self._request(
            "POST",
            "/api/students/wxy/letters/generate",
            token=self.student_token,
            headers={"Idempotency-Key": f"acceptance-letter-{self.run_tag}"},
        )
        data = resp.json()
        self.letter_job_id = data.get("job_id")
        ok = bool(resp.status_code == 200 and self.letter_job_id)
        self._record(
            "R8", "POST /students/{id}/letters/generate", ok, elapsed, f"job={self.letter_job_id}"
        )
        if not self.letter_job_id:
            return

        start_poll = time.perf_counter()
        status = "pending"
        for _ in range(30):
            resp, _ = self._request(
                "GET", f"/api/jobs/{self.letter_job_id}", token=self.student_token
            )
            job = resp.json()
            status = job.get("status")
            if status in ("done", "failed"):
                break
            time.sleep(0.5)
        elapsed_poll = time.perf_counter() - start_poll
        ok = status == "done"
        self._record("R6-L", "GET /jobs/{id} 信件轮询", ok, elapsed_poll, f"status={status}")
        self.metrics["letter_elapsed_s"] = round(elapsed_poll, 2)

    def r9_r10_lesson(self) -> None:
        resp, elapsed = self._request(
            "POST",
            "/api/lesson/generate",
            token=self.teacher_token,
            json_body={
                "topic": "F5 验收课",
                "goals": ["验证备课方案生成"],
                "guidance": "围绕梦想主题引导学生说出具体理想",
            },
        )
        data = resp.json()
        self.lesson_id = data.get("lesson_id")
        ok = bool(resp.status_code == 200 and self.lesson_id)
        self._record("R9", "POST /lesson/generate", ok, elapsed, f"lesson={self.lesson_id}")
        if not self.lesson_id:
            return

        resp, elapsed = self._request(
            "GET", f"/api/lessons/{self.lesson_id}", token=self.teacher_token
        )
        data = resp.json()
        ok = resp.status_code == 200 and data.get("lesson_id") == self.lesson_id
        self._record("R10", "GET /lessons/{id}", ok, elapsed)

    def r11_r12_r13_classroom(self) -> None:
        # start
        resp, elapsed = self._request(
            "POST",
            f"/api/classes/{CLASS_CODE}/session/start",
            token=self.teacher_token,
        )
        data = resp.json()
        ok = resp.status_code == 200 and data.get("state") == "active"
        self._record(
            "R11", "POST /classes/{code}/session/start", ok, elapsed, f"state={data.get('state')}"
        )

        # control pause
        resp, elapsed = self._request(
            "POST",
            f"/api/classes/{CLASS_CODE}/session/control",
            token=self.teacher_token,
            json_body={"action": "pause", "client_cmd_id": f"f5-pause-{self.run_tag}"},
        )
        data = resp.json()
        ok = resp.status_code == 200 and data.get("state") == "paused"
        self._record(
            "R12", "POST /classes/{code}/session/control", ok, elapsed, f"state={data.get('state')}"
        )

        # status
        resp, elapsed = self._request(
            "GET",
            f"/api/classes/{CLASS_CODE}/session/status",
            token=self.teacher_token,
        )
        data = resp.json()
        ok = resp.status_code == 200 and data.get("state") == "paused"
        self._record("R13", "GET /classes/{code}/session/status", ok, elapsed)

        # resume to avoid side effects
        self._request(
            "POST",
            f"/api/classes/{CLASS_CODE}/session/control",
            token=self.teacher_token,
            json_body={"action": "resume", "client_cmd_id": f"f5-resume-{self.run_tag}"},
        )

    def r14_r15_academic(self) -> None:
        rows = [
            {
                "student_no": "2023001",
                "name": "王小雅",
                "scores": [
                    {"subject": "语文", "score": 88, "trend": "up"},
                    {"subject": "数学", "score": 76, "trend": "down"},
                    {"subject": "英语", "score": 82, "trend": "flat"},
                ],
                "role": "member",
                "teacher_note": "验收导入",
            }
        ]
        resp1, elapsed1 = self._request(
            "POST",
            f"/api/classes/{CLASS_CODE}/academic",
            token=self.teacher_token,
            json_body={"records": rows},
        )
        data1 = resp1.json()
        count1 = data1.get("summary", {}).get("count", 0)

        resp2, elapsed2 = self._request(
            "POST",
            f"/api/classes/{CLASS_CODE}/academic",
            token=self.teacher_token,
            json_body={"records": rows},
        )
        data2 = resp2.json()
        count2 = data2.get("summary", {}).get("count", 0)

        ok = resp1.status_code == 200 and resp2.status_code == 200 and count1 == count2
        self._record(
            "R14",
            "POST /classes/{code}/academic 幂等",
            ok,
            max(elapsed1, elapsed2),
            f"count={count1}/{count2}",
        )

        resp, elapsed = self._request(
            "GET",
            f"/api/classes/{CLASS_CODE}/academic",
            token=self.teacher_token,
        )
        data = resp.json()
        records = data.get("records", [])
        ok = resp.status_code == 200 and len(records) == 8
        self._record(
            "R15",
            "GET /classes/{code}/academic",
            ok,
            elapsed,
            f"records={len(records)}",
        )

    def r16_lessons(self) -> None:
        resp, elapsed = self._request(
            "GET",
            f"/api/classes/{CLASS_CODE}/lessons",
            token=self.teacher_token,
        )
        data = resp.json()
        ok = resp.status_code == 200 and isinstance(data, list) and len(data) >= 4
        self._record("R16", "GET /classes/{code}/lessons", ok, elapsed, f"count={len(data)}")

    def r17_class_pets(self) -> None:
        resp, elapsed = self._request(
            "GET",
            f"/api/classes/{CLASS_CODE}/pets",
            token=self.teacher_token,
        )
        data = resp.json()
        ok = resp.status_code == 200 and isinstance(data, list) and len(data) == 8
        gray_top = (
            all(data[i].get("pet", {}).get("state") == "gray" for i in range(2))
            if len(data) >= 2
            else False
        )
        self._record(
            "R17",
            "GET /classes/{code}/pets",
            ok and gray_top,
            elapsed,
            f"count={len(data)}, gray_top={gray_top}",
        )

    def ws_first_response(self) -> None:
        latencies: list[float] = []
        student_token = self.student_token
        if not student_token:
            self._record("WS-P50", "语音首响 P50", False, detail="缺少学生 token")
            return

        for i in range(10):
            try:
                uri = (
                    f"{self.ws_base}/api/ws/voice?token={student_token}"
                    f"&student_id=wxy&mode=classroom"
                )
                start_at, first_at = asyncio.run(_ws_probe(uri))
                if start_at is not None and first_at is not None:
                    latencies.append(first_at - start_at)
            except Exception as exc:
                logger.warning("WS probe %d failed: %s", i, exc)

        if latencies:
            p50 = statistics.median(latencies)
            self.metrics["ws_p50_s"] = round(p50, 3)
            ok = p50 < 2.0
            self._record(
                "WS-P50",
                "语音首响 P50 < 2s",
                ok,
                detail=f"P50={p50:.3f}s over {len(latencies)} probes",
            )
        else:
            self._record("WS-P50", "语音首响 P50 < 2s", False, detail="无可用样本")

    def key_field_assertions(self) -> None:
        assertions: list[tuple[str, bool]] = []

        # 1. R1 班级关键字段
        resp, _ = self._request("GET", f"/api/classes/{CLASS_CODE}")
        data = resp.json()
        assertions.append(("R1.class_code == LTZ2024", data.get("class_code") == CLASS_CODE))
        assertions.append(("R1.region_key == yunnan", data.get("region_key") == "yunnan"))
        assertions.append(("R1.students count == 8", len(data.get("students", [])) == 8))

        # 2. R3 成长档案 light 视图无 scores
        resp, _ = self._request("GET", "/api/students/wxy/growth", token=self.student_token)
        data = resp.json()
        pet = data.get("pet") or {}
        assertions.append(("R3.light 无 scores", "scores" not in data))
        assertions.append(("R3.pet.state 合法", pet.get("state") in ("daily", "gray", "cheer")))

        # 3. R7 信件字段
        resp, _ = self._request("GET", "/api/students/wxy/letters", token=self.student_token)
        data = resp.json()
        has_unread = any(not letter.get("is_read") for letter in data) if data else False
        assertions.append(("R7 存在 is_read", data and "is_read" in data[0]))
        assertions.append(("R7 存在未读", has_unread))

        # 4. R15 学情汇总含 trend
        resp, _ = self._request(
            "GET", f"/api/classes/{CLASS_CODE}/academic", token=self.teacher_token
        )
        data = resp.json()
        records = data.get("records", [])
        has_trend = any("trend" in r.get("scores", [{}])[0] for r in records if r.get("scores"))
        assertions.append(("R15 scores 含 trend", has_trend))

        # 5. R17 班级宠物墙 gray 置顶
        resp, _ = self._request("GET", f"/api/classes/{CLASS_CODE}/pets", token=self.teacher_token)
        data = resp.json()
        gray_top = data[0].get("pet", {}).get("state") == "gray" if data else False
        assertions.append(("R17 gray 置顶", gray_top))

        all_ok = all(ok for _, ok in assertions)
        detail = "; ".join(f"{'✓' if ok else '✗'} {name}" for name, ok in assertions)
        self._record("KEY-FIELDS", "关键字段引用 10 项", all_ok, detail=detail)
        self.metrics["key_field_pass_rate"] = (
            "100%" if all_ok else f"{sum(ok for _, ok in assertions)}/{len(assertions)}"
        )

    def write_report(self) -> None:
        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)
        lines = [
            "# 小信 F5 联调验收报告\n",
            f"> 生成时间：{time.strftime('%Y-%m-%d %H:%M:%S')}\n",
            f"> 目标服务：{self.base_url}\n",
            "\n",
            "## 总览\n",
            f"- 用例通过：{passed}/{total}\n",
            f"- 语音首响 P50：{self.metrics.get('ws_p50_s', 'N/A')}s（目标 <2s）\n",
            f"- 生图耗时：{self.metrics.get('portrait_elapsed_s', 'N/A')}s（目标 <10s）\n",
            f"- 信件生成耗时：{self.metrics.get('letter_elapsed_s', 'N/A')}s\n",
            f"- 关键字段引用：{self.metrics.get('key_field_pass_rate', 'N/A')}\n",
            "\n",
            "## 用例明细\n",
            "\n",
            "| ID | 用例 | 结果 | 耗时 | 详情 |\n",
            "| --- | --- | --- | --- | --- |\n",
        ]
        for r in self.results:
            status = "PASS" if r["passed"] else "FAIL"
            elapsed = f"{r['elapsed_ms']}ms" if r["elapsed_ms"] is not None else "-"
            lines.append(f"| {r['id']} | {r['name']} | {status} | {elapsed} | {r['detail']} |\n")

        lines.extend(
            [
                "\n",
                "## 结论\n",
                "验收"
                + ("通过" if passed == total else f"未通过（{total - passed} 项失败）")
                + "。\n",
            ]
        )

        report_path = Path(__file__).resolve().parent.parent.parent / "docs" / "acceptance.md"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text("".join(lines), encoding="utf-8")
        logger.info("验收报告已写入：%s", report_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="小信 F5 联调验收脚本")
    parser.add_argument(
        "--base-url", default=DEFAULT_BASE_URL, help=f"后端地址（默认 {DEFAULT_BASE_URL}）"
    )
    args = parser.parse_args()

    runner = AcceptanceRunner(args.base_url)
    all_passed = runner.run()
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
