"""小信 FastAPI 入口。"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

import app.schemas as schemas_module
import logging
from app.db.migrate import ensure_migrated
from app.routers import (
    academic,
    admin,
    classes,
    classroom,
    growth,
    jobs,
    lesson,
    letters,
    points,
    session,
)
# voice_ws 依赖 agentscope，当 mcp/agentscope 版本不兼容时会阻断整个服务启动；
# 为保持防御性降级（核心业务 / 登录 / 课堂 路由不受影响），这里做 try/except 导入。
try:
    from app.routers import voice_ws as _voice_ws_router

    _VOICE_WS_AVAILABLE = True
except Exception as _voice_import_error:  # pragma: no cover - 环境依赖兜底
    logging.getLogger("main").warning(
        "voice_ws 路由未加载（语音会话功能暂不可用）：%s",
        _voice_import_error,
    )
    _voice_ws_router = None  # type: ignore[assignment]
    _VOICE_WS_AVAILABLE = False
from app.schemas import ErrorEnvelope, HealthCheck
from app.schemas import __all__ as schemas_all
from app.services.imagegen import static_dir


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    ensure_migrated()
    yield


app = FastAPI(
    title="小信 API",
    version="2.1.0",
    description="小信后端 API（契约 v2.1）",
    openapi_url="/api/openapi.json",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content=ErrorEnvelope(
            code="VALIDATION_ERROR",
            message="请求参数校验失败",
            details={"errors": exc.errors()},
        ).model_dump(),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    _request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict):
        return JSONResponse(status_code=exc.status_code, content=detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorEnvelope(
            code="HTTP_ERROR",
            message=str(detail),
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=ErrorEnvelope(
            code="INTERNAL",
            message="服务器内部错误",
        ).model_dump(),
    )


@app.get("/api/health", response_model=HealthCheck)
def health() -> HealthCheck:
    return HealthCheck()


def custom_openapi() -> dict[str, Any]:
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    components = openapi_schema.setdefault("components", {})
    schemas = components.setdefault("schemas", {})
    for name in schemas_all:
        if name not in schemas:
            model = getattr(schemas_module, name)
            if not isinstance(model, type) or not issubclass(model, BaseModel):
                continue
            schemas[name] = model.model_json_schema(
                ref_template="#/components/schemas/{model}"
            )
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi  # type: ignore[method-assign]


app.include_router(classes.router, prefix="/api")
app.include_router(session.router, prefix="/api")
app.include_router(growth.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(letters.router, prefix="/api")
app.include_router(lesson.router, prefix="/api")
app.include_router(academic.router, prefix="/api")
app.include_router(classroom.router, prefix="/api")
app.include_router(points.router, prefix="/api")
if _VOICE_WS_AVAILABLE:
    app.include_router(_voice_ws_router.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# 静态资源（班宠画像等）
app.mount("/api/static", StaticFiles(directory=static_dir()), name="static")
