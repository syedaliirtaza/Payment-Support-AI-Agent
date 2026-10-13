"""Map Pinecone client failures to actionable app errors."""

from app.core.config import settings


class PineconeAuthError(RuntimeError):
    """Pinecone returned 401 — API key missing, invalid, or wrong project."""


def pinecone_auth_message() -> str:
    return (
        "Pinecone rejected the API key (401 Unauthorized). "
        "In Railway → Variables, set PINECONE_API_KEY to a current key from "
        "Pinecone Console → API Keys for the project that owns index "
        f"'{settings.PINECONE_INDEX_NAME}'. Redeploy after saving. "
        "Deleting vectors in the Pinecone dashboard does not invalidate the key."
    )


def is_pinecone_unauthorized(exc: BaseException) -> bool:
    if type(exc).__name__ in ("UnauthorizedError", "UnauthorizedException"):
        return True
    message = str(exc).lower()
    return "401" in message and "unauthorized" in message


def raise_if_pinecone_unauthorized(exc: BaseException) -> None:
    if is_pinecone_unauthorized(exc):
        raise PineconeAuthError(pinecone_auth_message()) from exc
