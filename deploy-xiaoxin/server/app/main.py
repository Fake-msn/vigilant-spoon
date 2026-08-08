"""小信 FastAPI 入口。"""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

import app.schemas as schemas_module
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
    voice_ws,
)
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
app.include_router(voice_ws.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# 静态资源（班宠画像等）
app.mount("/api/static", StaticFiles(directory=static_dir()), name="static")


# ---- 前端静态资源托管（SPA）----
# 生产环境由同一个 FastAPI 进程托管 web-spa 构建产物，容器内通过 SPA_DIST_DIR 指定。
_SPA_DIST = (
    Path(os.environ["SPA_DIST_DIR"])
    if os.environ.get("SPA_DIST_DIR")
    else Path(__file__).resolve().parent.parent / "webspa-dist"
)


@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(full_path: str) -> Any:
    # /api 未匹配到的路径按接口 404 处理，避免被 SPA 兜底吞掉
    if full_path == "api" or full_path.startswith("api/"):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=ErrorEnvelope(
                code="NOT_FOUND", message="接口不存在"
            ).model_dump(),
        )
    if _SPA_DIST.is_dir():
        candidate = _SPA_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        index = _SPA_DIST / "index.html"
        if index.is_file():
            return FileResponse(index)
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=ErrorEnvelope(
            code="NOT_FOUND", message="资源不存在"
        ).model_dump(),
    )