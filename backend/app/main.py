from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.rag.pinecone_errors import PineconeAuthError

configure_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

origins = [origin.strip() for origin in settings.CORS_ALLOW_ORIGINS.split(",") if origin.strip()]
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/")
async def root() -> dict[str, str]:
    return {"status": "ok", "service": settings.PROJECT_NAME}


@app.exception_handler(PineconeAuthError)
async def pinecone_auth_error_handler(_request, exc: PineconeAuthError):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


app.include_router(v1_router)