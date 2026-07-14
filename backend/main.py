import app.models  # noqa: F401
from app.api.health import router as health_router
from app.api.meetings import router as meetings_router
from app.core.logging import configure_logging
from app.core.config import settings
from app.database.session import Base, engine
import logging
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger("meetwise.api")


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(
        title="MeetWise AI API",
        description="Backend API for the intelligent meeting summarizer.",
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin, "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(meetings_router)

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        started_at = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - started_at) * 1000
        logger.info("%s %s -> %s %.1fms", request.method, request.url.path, response.status_code, elapsed_ms)
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        logger.warning("Validation error on %s %s: %s", request.method, request.url.path, exc.errors())
        return JSONResponse(status_code=422, content={"detail": "Request validation failed."})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
        return JSONResponse(status_code=500, content={"detail": "Unexpected server error."})

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized")

    return app


app = create_app()
