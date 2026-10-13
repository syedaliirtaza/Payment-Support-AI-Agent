from openai import AsyncOpenAI

from app.core.config import settings

_client: AsyncOpenAI | None = None


def get_openai_client() -> AsyncOpenAI:
    """Return a lazily-initialized, shared AsyncOpenAI client."""
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not set — add it to your .env file.")
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client
