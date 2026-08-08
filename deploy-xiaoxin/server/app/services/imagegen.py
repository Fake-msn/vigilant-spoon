"""班宠画像生成服务（方案 5.2）。

- `image_provider=placeholder`（默认）：生成本地占位 PNG 并落盘，避免 404。
- `image_provider=dashscope`：调用 DashScope 文生图接口生成真实画像。

任何失败（未配置 key / 调用异常）一律回退到占位图，保证演示铁律：
未配置 key 时系统仍可返回可访问的画像文件。
"""

from __future__ import annotations

import logging
import struct
import time
import zlib
from pathlib import Path
from typing import Any

import httpx

from app.services import runtime_config

logger = logging.getLogger("imagegen")

# DashScope 文生图：提交任务 + 轮询任务结果
_SUBMIT_PATH = "/image-synthesis"
_TASK_HOST = "https://dashscope.aliyuncs.com/api/v1/tasks/"


def static_dir() -> Path:
    d = Path(__file__).resolve().parent.parent / "static"
    d.mkdir(parents=True, exist_ok=True)
    return d


def portraits_dir() -> Path:
    """返回画像输出目录，并确保目录存在。"""
    d = static_dir() / "portraits"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def _placeholder_png(path: Path, seed: int) -> None:
    """用 zlib+struct 生成一张纯占位 PNG（零第三方依赖）。"""
    width, height = 256, 256
    palette = [(255, 214, 165), (165, 214, 255), (214, 255, 165), (255, 165, 214)]
    base = palette[seed % len(palette)]
    rows: list[bytes] = []
    for y in range(height):
        row = bytearray([0])  # filter type 0
        for x in range(width):
            if ((x // 16) + (y // 16)) % 2 == 0:
                r = max(0, base[0] - (y // 4))
                g = max(0, base[1] - (x // 4))
                b = max(0, base[2] - ((x + y) // 4))
            else:
                r, g, b = base
            row += bytes((r, g, b))
        rows.append(bytes(row))
    raw = b"".join(rows)

    png = b"\x89PNG\r\n\x1a\n"
    png += _chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    png += _chunk(b"IDAT", zlib.compress(raw))
    png += _chunk(b"IEND", b"")
    path.write_bytes(png)


def _submit_task(client: httpx.Client, prompt: str) -> str:
    """提交文生图任务，返回 task_id。"""
    api_key = runtime_config.get("image_api_key")
    resp = client.post(
        runtime_config.get("image_base_url") + _SUBMIT_PATH,
        headers={
            "Authorization": f"Bearer {api_key}",
            "X-DashScope-Async": "enable",
        },
        json={
            "model": runtime_config.get("image_model"),
            "input": {"prompt": prompt},
            "parameters": {"size": "1024*1024", "n": 1},
        },
    )
    resp.raise_for_status()
    data = resp.json()
    output = data.get("output", {})
    task_id = output.get("task_id")
    if not task_id:
        raise RuntimeError(f"DashScope 未返回 task_id: {data}")
    return str(task_id)


def _wait_task(client: httpx.Client, task_id: str, timeout: float = 120.0) -> str:
    """轮询任务直到 SUCCEEDED，返回图片 URL。"""
    api_key = runtime_config.get("image_api_key")
    deadline = time.monotonic() + timeout
    while True:
        resp = client.get(
            _TASK_HOST + task_id,
            headers={"Authorization": f"Bearer {api_key}"},
        )
        data = resp.json()
        output = data.get("output", {})
        status = output.get("task_status")
        if status == "SUCCEEDED":
            results = output.get("results") or []
            if not results:
                raise RuntimeError("DashScope 任务成功但无图片结果")
            return str(results[0].get("url", ""))
        if status in ("FAILED", "CANCELED"):
            reason = "失败" if status == "FAILED" else "取消"
            raise RuntimeError(f"DashScope 任务{reason}: {data}")
        if time.monotonic() > deadline:
            raise TimeoutError(f"DashScope 任务超时: {task_id}")
        time.sleep(3)


def _dashscope_generate(prompt: str, out_path: Path) -> None:
    """调用 DashScope 文生图并保存到 out_path。"""
    with httpx.Client(timeout=30) as client:
        task_id = _submit_task(client, prompt)
        image_url = _wait_task(client, task_id)
    with httpx.Client(timeout=60) as client:
        resp = client.get(image_url)
        resp.raise_for_status()
        out_path.write_bytes(resp.content)
    logger.info("DashScope 画像已保存: %s", out_path)


def generate_portrait(prompt: str, out_path: Path, seed: int = 0) -> bool:
    """生成画像到 out_path；无论何种 provider 均保证落盘，返回是否成功。"""
    provider = runtime_config.get("image_provider")
    api_key = runtime_config.get("image_api_key")
    if provider == "dashscope" and api_key:
        try:
            _dashscope_generate(prompt, out_path)
            return True
        except Exception:
            logger.exception("DashScope 文生图失败，回退占位图")
            _placeholder_png(out_path, seed)
            return True

    if provider not in ("placeholder", "dashscope"):
        logger.warning("未知 image_provider=%r，回退占位图", provider)
    elif provider == "dashscope":
        logger.info("image_api_key 未配置，回退占位图")
    _placeholder_png(out_path, seed)
    return True


def build_prompt(student: dict[str, Any]) -> str:
    """根据学生档案构造文生图 prompt。"""
    ideal = student.get("ideal") or "一位友爱的小学生"
    species = student.get("species") or "cat"
    return (
        "Q版可爱吉祥物班会宠物，扁平卡通插画风格，"
        f"主题契合「{ideal}」的梦想，外观为{_species_cn(species)}造型，"
        "温暖明快的色彩，透明或纯色背景，适合儿童 App 展示。"
    )


_SPECIES_CN: dict[str, str] = {
    "cat": "小猫咪",
    "dog": "小狗狗",
    "rabbit": "小兔子",
    "bear": "小熊",
    "panda": "小熊猫",
    "bird": "小黄鸟",
    "fox": "小狐狸",
    "dragon": "小龙",
}


def _species_cn(species: str) -> str:
    return _SPECIES_CN.get(species, species)
