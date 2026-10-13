from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Payment Support Agent"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # pinecone
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "payment-support-knowledge"
    PINECONE_NAMESPACE: str = "knowledge"
    PINECONE_CLOUD: str = "aws"
    PINECONE_REGION: str = "us-east-1"
    PINECONE_EMBED_MODEL: str = "multilingual-e5-large"

    # openai
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # API runtime / deployment
    CORS_ALLOW_ORIGINS: str = ""

    # agent SSE — minimum time a step stays in "running" before "completed"
    AGENT_STEP_MIN_DURATION_SEC: float = 0.85
    # pause after a step completes before the next step event is emitted
    AGENT_STEP_PAUSE_SEC: float = 0.15

    @field_validator("PINECONE_API_KEY", "OPENAI_API_KEY", mode="before")
    @classmethod
    def strip_secret(cls, value: object) -> str:
        if value is None:
            return ""
        text = str(value).strip()
        if len(text) >= 2 and text[0] == text[-1] and text[0] in "\"'":
            text = text[1:-1].strip()
        return text

    class Config:
        env_file = ".env"

settings = Settings()