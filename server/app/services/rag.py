"""RAG 知识库服务：文本分块 -> 向量化 -> SQLite 存储 -> 余弦相似度检索。

按「RAG 铁律」仅用于开场素材 / 备课 / 评语，不参与对话轮次。

降级铁律：embedding 未配置（`embed_provider=disabled` 或无 key）时，
`add_document` 为 no-op、`search`/`build_context` 返回空，保证系统可稳定演示。
"""

from __future__ import annotations

import json
import logging
import math
import uuid
from datetime import datetime, timezone

from app.db import get_db_connection
from app.services import runtime_config

logger = logging.getLogger("rag")

CHUNK_SIZE = 200  # 每块最大字符数
CHUNK_OVERLAP = 40  # 相邻块重叠，避免切分截断语义

VALID_CATEGORIES = ("lesson", "comment", "classroom", "general")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def embedding_configured() -> bool:
    """是否已配置可用的 embedding 服务。"""
    if runtime_config.get("embed_provider") != "dashscope":
        return False
    return bool(runtime_config.get("embed_api_key"))


def _embed_texts(texts: list[str]) -> list[list[float]] | None:
    """调用 DashScope text-embedding-v3 向量化；未配置 / 失败时返回 None。"""
    if not embedding_configured():
        logger.info("embedding 未配置，跳过向量化")
        return None

    try:
        from openai import OpenAI
    except ImportError:
        logger.exception("未安装 openai SDK")
        return None

    try:
        client = OpenAI(
            api_key=runtime_config.get("embed_api_key"),
            base_url=runtime_config.get("embed_base_url") or None,
        )
        resp = client.embeddings.create(
            model=runtime_config.get("embed_model"),
            input=texts,
        )
        data = sorted(resp.data, key=lambda d: d.index)
        return [list(d.embedding) for d in data]
    except Exception:
        logger.exception("embedding 调用失败")
        return None


def _chunk_text(text: str) -> list[str]:
    """把长文本切成重叠分块。"""
    normalized = " ".join(text.split())
    if len(normalized) <= CHUNK_SIZE:
        return [normalized] if normalized else []
    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        end = min(start + CHUNK_SIZE, len(normalized))
        chunks.append(normalized[start:end])
        if end >= len(normalized):
            break
        start = end - CHUNK_OVERLAP
    return chunks


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def add_document(
    title: str,
    content: str,
    category: str = "general",
    source: str = "manual",
) -> str | None:
    """分块 + 向量化 + 入库。返回 doc_id；embedding 未配置 / 失败时返回 None。"""
    if not content or not content.strip():
        logger.warning("知识文档内容为空，跳过")
        return None
    if category not in VALID_CATEGORIES:
        category = "general"

    chunks = _chunk_text(content)
    if not chunks:
        return None

    embeddings = _embed_texts(chunks)
    if embeddings is None or len(embeddings) != len(chunks):
        logger.info("embedding 不可用（%s），文档未入库", title)
        return None

    doc_id = f"kd-{uuid.uuid4().hex[:12]}"
    now = _now()
    conn = get_db_connection()
    try:
        conn.execute(
            """
            INSERT INTO knowledge_docs (doc_id, title, content, category, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (doc_id, title, content, category, source, now),
        )
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings, strict=True)):
            conn.execute(
                """
                INSERT INTO knowledge_chunks (doc_id, chunk_index, content, embedding, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (doc_id, i, chunk, json.dumps(emb), now),
            )
        conn.commit()
    finally:
        conn.close()
    logger.info("知识文档已入库：%s（%d 块）", title, len(chunks))
    return doc_id


def remove_document(doc_id: str) -> bool:
    """删除文档及其分块。"""
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM knowledge_chunks WHERE doc_id = ?", (doc_id,))
        cur = conn.execute("DELETE FROM knowledge_docs WHERE doc_id = ?", (doc_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def list_documents() -> list[dict[str, str | int | float]]:
    """列出文档与各自分块数。"""
    conn = get_db_connection()
    try:
        rows = conn.execute(
            """
            SELECT d.doc_id, d.title, d.category, d.source, d.created_at,
                   COUNT(c.chunk_id) AS chunk_count
            FROM knowledge_docs d
            LEFT JOIN knowledge_chunks c ON c.doc_id = d.doc_id
            GROUP BY d.doc_id
            ORDER BY d.created_at DESC
            """
        ).fetchall()
        return [
            {
                "doc_id": row["doc_id"],
                "title": row["title"],
                "category": row["category"],
                "source": row["source"],
                "created_at": row["created_at"],
                "chunk_count": row["chunk_count"],
            }
            for row in rows
        ]
    finally:
        conn.close()


def count_documents() -> tuple[int, int]:
    """返回 (文档数, 分块数)。"""
    conn = get_db_connection()
    try:
        doc = conn.execute("SELECT COUNT(*) AS n FROM knowledge_docs").fetchone()["n"]
        chunk = conn.execute("SELECT COUNT(*) AS n FROM knowledge_chunks").fetchone()["n"]
        return doc, chunk
    finally:
        conn.close()


def search(
    query: str,
    top_k: int = 4,
    category: str | None = None,
) -> list[dict[str, str | int | float]]:
    """按余弦相似度检索最相关分块；embedding 未配置时返回空。"""
    query_vec = _embed_texts([query])
    if not query_vec:
        return []

    conn = get_db_connection()
    try:
        if category and category in VALID_CATEGORIES:
            rows = conn.execute(
                """
                SELECT c.chunk_id, c.doc_id, c.content, c.embedding
                FROM knowledge_chunks c
                JOIN knowledge_docs d ON d.doc_id = c.doc_id
                WHERE c.embedding IS NOT NULL AND d.category = ?
                """,
                (category,),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT chunk_id, doc_id, content, embedding
                FROM knowledge_chunks WHERE embedding IS NOT NULL
                """
            ).fetchall()
    finally:
        conn.close()

    scored: list[dict[str, str | int | float]] = []
    for row in rows:
        try:
            vec = json.loads(row["embedding"])
        except (json.JSONDecodeError, TypeError):
            continue
        score = _cosine(query_vec[0], vec)
        scored.append(
            {
                "chunk_id": row["chunk_id"],
                "doc_id": row["doc_id"],
                "content": row["content"],
                "score": score,
            }
        )
    scored.sort(key=lambda r: float(r["score"]), reverse=True)
    return scored[:top_k]


def build_context(query: str, top_k: int = 4, category: str | None = None) -> str:
    """检索并把最相关分块拼成供 LLM 的上下文文本；无结果时返回空串。"""
    results = search(query, top_k=top_k, category=category)
    if not results:
        return ""
    return "\n".join(f"- {r['content']}" for r in results)


# ---- 内置种子语料（教材要点 / 班级规范 / 评语范例）----
DEFAULT_CORPUS: list[dict[str, str]] = [
    {
        "title": "思政课：我的梦想与理想教育",
        "category": "lesson",
        "source": "seed",
        "content": (
            "思政课理想教育要点：引导学生从身边小事出发谈梦想，把抽象的'理想'落到具体行动。"
            "适宜三步法：一、让学生说出一个具体理想（职业或兴趣方向）；二、聊聊为了实现它可以做的"
            "一件本周小事；三、回看并肯定已有进步。开场素材可围绕'长大后的我''梦想清单'创设情境，"
            "鼓励人人发言、不评判他人的职业选择。对内向学生可从兴趣话题切入，降低表达门槛。"
        ),
    },
    {
        "title": "思政课：家乡与远方",
        "category": "lesson",
        "source": "seed",
        "content": (
            "备课素材：《家乡与远方》，面向农村小学思政课堂。教学目标是拓宽职业与视野想象，"
            "从家乡生活出发讨论'山外面的世界'。引导策略：先请学生描述家乡最有特点的一处景物或"
            "一件日常小事，再延展到'如果有一天走出大山，你最想做什么'。注意尊重乡土情感，不贬低"
            "家乡，把'远方'与'家乡'并置而非对立。"
        ),
    },
    {
        "title": "评语范例：鼓励内向学生",
        "category": "comment",
        "source": "seed",
        "content": (
            "评语写作范例（针对内向、发言少的学生）：语气温和、先肯定再引导。示例——'老师注意到你"
            "最近在做的一件小事，很用心。慢慢来，不着急，愿意的时候随时可以和小伙伴分享。'"
            "原则：不施压、用具体观察代替笼统表扬、把'表达'拆成可完成的小步骤（如每天和一位同学"
            "打招呼），并强调陪伴与支持。"
        ),
    },
    {
        "title": "评语范例：留守儿童关怀",
        "category": "comment",
        "source": "seed",
        "content": (
            "评语写作范例（因父母外出务工需关怀的学生）：先共情再给支持，避免说教。示例——'老师和小信"
            "都很想你，你并不孤单，我们一直陪着你。抱抱你，想爸妈的时候可以和我们说说。'"
            "原则：承认情绪、降低孤独感、提供可求助的成人线索（班主任），并安排线下一对一谈心；"
            "不使用'你要坚强''别人也一样'等压抑情绪的表达。"
        ),
    },
    {
        "title": "班级规范：课堂发言",
        "category": "classroom",
        "source": "seed",
        "content": (
            "课堂发言规范：鼓励举手主动发言，答对或积极参与都给予肯定；尊重他人表达，不嘲笑、不打断。"
            "积分激励：主动举手发言 +5 分，回答正确 +10 分。教师应给每个学生发言机会，尤其关注"
            "性格内向的学生，用小组讨论降低个人压力。"
        ),
    },
    {
        "title": "班级规范：作业与小组合作",
        "category": "classroom",
        "source": "seed",
        "content": (
            "作业与小组规范：作业按时提交 +8 分，作业优秀 +15 分。"
            "小组竞赛模式可将班级分为 4-6 个小组，"
            "每组共同喂养一只宠物，培养团队协作；小组积分汇总后形成排行榜，仅教师端可见。"
            "强调过程性鼓励而非只重结果，长期无积分的学生的宠物会'饥饿'，教师应及时发现并正向引导。"
        ),
    },
]


def seed_default_corpus() -> int:
    """写入内置种子语料（幂等：同名文档跳过）。返回成功入库数量。"""
    added = 0
    if not embedding_configured():
        logger.info("embedding 未配置，跳过种子语料入库")
        return 0
    conn = get_db_connection()
    try:
        existing = {
            row["title"]
            for row in conn.execute("SELECT title FROM knowledge_docs WHERE source = 'seed'")
        }
    finally:
        conn.close()

    for doc in DEFAULT_CORPUS:
        if doc["title"] in existing:
            continue
        doc_id = add_document(
            doc["title"],
            doc["content"],
            category=doc["category"],
            source=doc["source"],
        )
        if doc_id:
            added += 1
    return added
