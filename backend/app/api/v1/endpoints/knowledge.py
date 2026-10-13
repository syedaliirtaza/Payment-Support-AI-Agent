from fastapi import APIRouter, HTTPException, UploadFile
from pydantic import ValidationError

from app.rag.knowledge_base import knowledge_base
from app.rag.loaders import extract_text
from app.schemas.knowledge import IngestResponse, KnowledgeDocumentRecord, TextIngestRequest

router = APIRouter(tags=["knowledge"])


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(document_id: str) -> None:
    """Delete all chunks for a document from Pinecone and the manifest."""
    if not document_id.strip():
        raise HTTPException(status_code=400, detail="document_id is required")
    await knowledge_base.delete_document(document_id.strip())


@router.get("/documents", response_model=list[KnowledgeDocumentRecord])
async def list_documents() -> list[KnowledgeDocumentRecord]:
    """List documents indexed in the knowledge base (manifest + Pinecone backfill)."""
    records = await knowledge_base.list_documents()
    validated: list[KnowledgeDocumentRecord] = []
    for record in records:
        try:
            validated.append(KnowledgeDocumentRecord.model_validate(record))
        except ValidationError:
            continue
    return validated


@router.post("/text", response_model=IngestResponse)
async def ingest_text(request: TextIngestRequest) -> IngestResponse:
    """Ingest plain text pasted into the knowledge page."""
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="content must not be empty")

    result = await knowledge_base.ingest_document(
        title=request.title, text=request.content, source="text"
    )
    return IngestResponse(title=request.title, source="text", **result)


@router.post("/upload", response_model=IngestResponse)
async def ingest_file(file: UploadFile) -> IngestResponse:
    """Ingest an uploaded document (PDF, TXT, MD, or JSON)."""
    filename = file.filename or "upload"
    data = await file.read()
    try:
        text = extract_text(filename, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 — surface any parse failure as a 400
        raise HTTPException(status_code=400, detail=f"could not read file: {exc}") from exc

    result = await knowledge_base.ingest_document(title=filename, text=text, source=filename)
    if result["chunks"] == 0:
        raise HTTPException(status_code=400, detail="no text could be extracted from the file")
    return IngestResponse(title=filename, source=filename, **result)
