"""管理员后台：模型服务配置管理与教师注册审批（方案 5.3）。

- `POST /admin/login`：管理员密码登录，签发 `ad_` token。
- `GET /admin/config`：读取当前生效配置（env 默认 + DB 覆盖）。
- `PUT /admin/config`：部分更新模型配置。
- `GET /admin/teachers/pending`：待审核教师注册列表。
- `POST /admin/teachers/{teacher_id}/review`：通过 / 驳回教师注册。
"""

import secrets
import sqlite3
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.db import get_db_connection
from app.deps import get_current_admin
from app.schemas import (
    AdminLoginReq,
    AdminLoginResp,
    KnowledgeDoc,
    KnowledgeDocCreate,
    KnowledgeDocList,
    KnowledgeStatus,
    PendingTeacherReview,
    PendingTeacherReviewList,
    ServiceConfig,
    ServiceConfigUpdate,
    TeacherReviewReq,
)
from app.schemas.common import ErrorEnvelope
from app.services import rag, runtime_config

router = APIRouter(prefix="/admin", tags=["admin"])

SESSION_TTL_HOURS = 12


def _issue_token() -> str:
    return f"ad_{secrets.token_urlsafe(36)[:48]}"


def _unauthorized(code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=ErrorEnvelope(code=code, message=message).model_dump(),
    )


@router.post("/login", response_model=AdminLoginResp)
def admin_login(req: AdminLoginReq) -> AdminLoginResp:
    """管理员密码登录。"""
    if not settings.admin_password or req.password != settings.admin_password:
        raise _unauthorized("INVALID_PASSWORD", "管理员密码错误")

    token = _issue_token()
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(hours=SESSION_TTL_HOURS)

    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO admin_sessions (token, issued_at, expires_at) VALUES (?, ?, ?)",
            (token, issued_at.isoformat(), expires_at.isoformat()),
        )
        conn.commit()
    finally:
        conn.close()

    return AdminLoginResp(session_token=token, expires_at=expires_at.isoformat())


@router.get("/config", response_model=ServiceConfig)
def get_config(_admin: str = Depends(get_current_admin)) -> ServiceConfig:
    """读取当前生效的模型服务配置。"""
    return ServiceConfig(**runtime_config.get_config())


@router.put("/config", response_model=ServiceConfig)
def update_config(
    update: ServiceConfigUpdate,
    _admin: str = Depends(get_current_admin),
) -> ServiceConfig:
    """部分更新模型服务配置，未提供的字段保持不变。"""
    values = {k: v for k, v in update.model_dump().items() if v is not None}
    return ServiceConfig(**runtime_config.set_config(values))


def _as_str(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return str(value)


def _pending_teacher_not_found(teacher_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="PENDING_TEACHER_NOT_FOUND",
            message="待审教师不存在或已处理",
            details={"teacher_id": teacher_id},
        ).model_dump(),
    )


def _row_to_review(row: sqlite3.Row) -> PendingTeacherReview:
    return PendingTeacherReview(
        teacher_id=_as_str(row["teacher_id"]),
        name=_as_str(row["name"]),
        school=_as_str(row["school"]),
        phone=_as_str(row["phone"]),
        subject=_as_str(row["subject"]),
        title=_as_str(row["title"]),
        created_at=_as_str(row["created_at"]),
    )


@router.get("/teachers/pending", response_model=PendingTeacherReviewList)
def list_pending_teachers(_admin: str = Depends(get_current_admin)) -> PendingTeacherReviewList:
    """列出所有待管理员审核的教师注册。"""
    conn = get_db_connection()
    try:
        rows = conn.execute(
            "SELECT teacher_id, name, school, phone, subject, title, created_at "
            "FROM teachers WHERE status = 'pending' ORDER BY created_at DESC"
        ).fetchall()
        return PendingTeacherReviewList(items=[_row_to_review(r) for r in rows])
    finally:
        conn.close()


@router.post("/teachers/{teacher_id}/review", response_model=PendingTeacherReviewList)
def review_teacher(
    teacher_id: str,
    req: TeacherReviewReq,
    _admin: str = Depends(get_current_admin),
) -> PendingTeacherReviewList:
    """管理员审核教师注册：通过或驳回。"""
    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT teacher_id FROM teachers WHERE teacher_id = ? AND status = 'pending'",
            (teacher_id,),
        ).fetchone()
        if row is None:
            raise _pending_teacher_not_found(teacher_id)

        if req.approve:
            conn.execute(
                "UPDATE teachers SET status = 'active', reject_reason = NULL WHERE teacher_id = ?",
                (teacher_id,),
            )
        else:
            conn.execute(
                "UPDATE teachers SET status = 'rejected', reject_reason = ? WHERE teacher_id = ?",
                (req.reject_reason or "", teacher_id),
            )
        conn.commit()

        rows = conn.execute(
            "SELECT teacher_id, name, school, phone, subject, title, created_at "
            "FROM teachers WHERE status = 'pending' ORDER BY created_at DESC"
        ).fetchall()
        return PendingTeacherReviewList(items=[_row_to_review(r) for r in rows])
    finally:
        conn.close()


# ---- RAG 知识库管理 ----

CONFIG_CLASSES: dict[str, str] = {
    "lesson": "备课素材",
    "comment": "评语范例",
    "classroom": "班级规范",
    "general": "通用",
}


def _doc_not_found(doc_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=ErrorEnvelope(
            code="KNOWLEDGE_DOC_NOT_FOUND",
            message="知识文档不存在",
            details={"doc_id": doc_id},
        ).model_dump(),
    )


@router.get("/knowledge", response_model=KnowledgeDocList)
def list_knowledge(_admin: str = Depends(get_current_admin)) -> KnowledgeDocList:
    """列出知识库全部文档。"""
    items = [
        KnowledgeDoc(
            doc_id=str(d["doc_id"]),
            title=str(d["title"]),
            category=str(d["category"]),
            source=str(d["source"]),
            chunk_count=int(d["chunk_count"]),
            created_at=str(d["created_at"]),
        )
        for d in rag.list_documents()
    ]
    return KnowledgeDocList(items=items, total=len(items))


@router.post("/knowledge", response_model=KnowledgeDocList)
def create_knowledge(
    req: KnowledgeDocCreate,
    _admin: str = Depends(get_current_admin),
) -> KnowledgeDocList:
    """新增知识文档（分块 + 向量化 + 入库）。"""
    doc_id = rag.add_document(
        req.title,
        req.content,
        category=req.category,
        source=req.source,
    )
    if doc_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorEnvelope(
                code="EMBEDDING_UNAVAILABLE",
                message="embedding 未配置或向量化失败，文档未入库",
            ).model_dump(),
        )
    return list_knowledge(_admin)


@router.post("/knowledge/seed", response_model=KnowledgeDocList)
def seed_knowledge(_admin: str = Depends(get_current_admin)) -> KnowledgeDocList:
    """写入内置种子语料（幂等）。"""
    rag.seed_default_corpus()
    return list_knowledge(_admin)


@router.delete("/knowledge/{doc_id}", response_model=KnowledgeDocList)
def delete_knowledge(
    doc_id: str,
    _admin: str = Depends(get_current_admin),
) -> KnowledgeDocList:
    """删除知识文档及其分块。"""
    if not rag.remove_document(doc_id):
        raise _doc_not_found(doc_id)
    return list_knowledge(_admin)


@router.get("/knowledge/status", response_model=KnowledgeStatus)
def knowledge_status(_admin: str = Depends(get_current_admin)) -> KnowledgeStatus:
    """知识库状态：embedding 配置与文档 / 分块计数。"""
    doc_count, chunk_count = rag.count_documents()
    return KnowledgeStatus(
        embed_provider=runtime_config.get("embed_provider"),
        embed_model=runtime_config.get("embed_model"),
        configured=rag.embedding_configured(),
        doc_count=doc_count,
        chunk_count=chunk_count,
    )
