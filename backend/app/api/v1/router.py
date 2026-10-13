from fastapi import APIRouter
from app.api.v1.endpoints import health, knowledge, tickets
from app.core.config import settings

router = APIRouter(prefix=settings.API_V1_STR, tags=["v1"])

router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

router.include_router(
    tickets.router,
    prefix="/tickets",
    tags=["tickets"]
)

router.include_router(
    knowledge.router,
    prefix="/knowledge",
    tags=["knowledge"]
)