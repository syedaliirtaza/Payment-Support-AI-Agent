from pydantic import BaseModel, ConfigDict, Field


class PolicyChunk(BaseModel):
    """A passage of company policy retrieved for a ticket."""

    id: str
    text: str
    title: str | None = None
    source: str | None = None
    score: float


class TextIngestRequest(BaseModel):
    """Plain-text knowledge submitted from the knowledge page."""

    title: str
    content: str


class IngestResponse(BaseModel):
    """Result of ingesting a document into the knowledge base."""

    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(alias="documentId")
    title: str
    source: str
    chunks: int


class KnowledgeDocumentRecord(BaseModel):
    """A document indexed in the knowledge base (for the UI list)."""

    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(alias="documentId")
    title: str
    source: str
    chunks: int
    ingested_at: str = Field(alias="ingestedAt")
    method: str
