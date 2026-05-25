import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.logging_middleware import LoggingMiddleware
from app.routers import auth, doctors, departments, appointments, queue, notifications, reports, audit


# Configure structured logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("mediqueue")


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🏥 MediQueue API starting up — %s", settings.ENVIRONMENT)
    yield
    logger.info("🏥 MediQueue API shutting down")
    await engine.dispose()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Clinical Appointment & Patient Flow Management API. "
        "All endpoints return `{ success, data, error, message, meta }`."
    ),
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware (order matters — outermost runs first on request, last on response)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins_list() if settings.ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from app.middleware.audit_middleware import AuditMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

app.add_middleware(AuditMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIDMiddleware)




# ---------------------------------------------------------------------------
# Global exception handler — catch-all for unhandled errors
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "error": {
                "message": "An unexpected error occurred. Please try again.",
                "code": "INTERNAL_SERVER_ERROR",
                "details": None,
            },
            "message": "Internal server error",
            "meta": {},
        },
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
API_PREFIX = "/api/v1"

# Phase 1 — Auth
app.include_router(auth.router, prefix=API_PREFIX)

# Phase 2 — Core Services
app.include_router(doctors.router, prefix=API_PREFIX)
app.include_router(departments.router, prefix=API_PREFIX)
app.include_router(appointments.router, prefix=API_PREFIX)
app.include_router(queue.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)

# Phase 3 — Advanced
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(audit.router, prefix=API_PREFIX)




# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["System"])
async def health():
    return {"status": "ok", "version": settings.APP_VERSION, "env": settings.ENVIRONMENT}
