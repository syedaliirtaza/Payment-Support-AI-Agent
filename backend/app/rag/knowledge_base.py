import asyncio
import json
import logging
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from pinecone import NotFoundException, Pinecone

from app.core.config import settings
from app.rag.chunking import chunk_text
from app.rag.pinecone_errors import raise_if_pinecone_unauthorized
from app.schemas.knowledge import PolicyChunk

# Record field whose text is embedded by Pinecone's integrated model.
_TEXT_FIELD = "text"

_MANIFEST_PATH = Path(__file__).resolve().parent.parent / "data" / "knowledge_manifest.json"

logger = logging.getLogger(__name__)


class KnowledgeBase:
    """RAG knowledge base backed by a Pinecone integrated-inference index.

    Pinecone hosts the embedding model, so documents and queries are sent as
    raw text and embedded server-side — no separate embedding API key needed.
    The Pinecone connection is established lazily on first use.
    """

    def __init__(self) -> None:
        self._pc: Pinecone | None = None
        self._index = None

    def _get_index(self):
        """Return the Pinecone index handle, creating the index on first use."""
        if self._index is not None:
            return self._index
        if not settings.PINECONE_API_KEY:
            raise RuntimeError(
                "PINECONE_API_KEY is not set. Configure it to use knowledge endpoints."
            )
        if self._pc is None:
            self._pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        name = settings.PINECONE_INDEX_NAME
        if not self._pc.has_index(name):
            self._pc.create_index_for_model(
                name=name,
                cloud=settings.PINECONE_CLOUD,
                region=settings.PINECONE_REGION,
                embed={
                    "model": settings.PINECONE_EMBED_MODEL,
                    "field_map": {"text": _TEXT_FIELD},
                },
            )
        self._index = self._pc.Index(name)
        return self._index

    def _read_manifest(self) -> list[dict]:
        if not _MANIFEST_PATH.exists():
            return []
        try:
            data = json.loads(_MANIFEST_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []
        return data if isinstance(data, list) else []

    def _write_manifest(self, records: list[dict]) -> None:
        _MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
        _MANIFEST_PATH.write_text(
            json.dumps(records, indent=2),
            encoding="utf-8",
        )

    def _record_document(
        self,
        document_id: str,
        title: str,
        source: str,
        chunks: int,
    ) -> dict:
        entry = {
            "document_id": document_id,
            "title": title,
            "source": source,
            "chunks": chunks,
            "ingested_at": datetime.now(timezone.utc).isoformat(),
            "method": "text" if source == "text" else "file",
        }
        manifest = [
            record
            for record in self._read_manifest()
            if record.get("document_id") != document_id
        ]
        manifest.insert(0, entry)
        self._write_manifest(manifest)
        return entry

    def _ingest_sync(self, title: str, text: str, source: str) -> dict:
        chunks = chunk_text(text)
        document_id = uuid.uuid4().hex
        records = [
            {
                "_id": f"{document_id}-{i}",
                _TEXT_FIELD: chunk,
                "document_id": document_id,
                "title": title,
                "source": source,
                "chunk_index": i,
            }
            for i, chunk in enumerate(chunks)
        ]
        if records:
            try:
                self._get_index().upsert_records(
                    namespace=settings.PINECONE_NAMESPACE, records=records
                )
            except Exception as exc:
                raise_if_pinecone_unauthorized(exc)
                raise
        result = {"document_id": document_id, "chunks": len(records)}
        if len(records) > 0:
            self._record_document(document_id, title, source, len(records))
        return result

    def _discover_documents_from_index_sync(self) -> list[dict]:
        """Rebuild document summaries from vectors already stored in Pinecone."""
        try:
            index = self._get_index()
        except Exception as exc:  # noqa: BLE001 — Pinecone may be unavailable locally
            logger.warning("Could not connect to Pinecone for document discovery: %s", exc)
            return []

        namespace = settings.PINECONE_NAMESPACE
        chunk_ids_by_doc: dict[str, list[str]] = defaultdict(list)
        min_chunk_by_doc: dict[str, int] = {}

        try:
            for page in index.list(namespace=namespace, limit=100):
                for item in page.vectors or []:
                    vector_id = item.id
                    parts = vector_id.rsplit("-", 1)
                    if len(parts) != 2 or not parts[1].isdigit():
                        continue
                    document_id, chunk_index = parts[0], int(parts[1])
                    chunk_ids_by_doc[document_id].append(vector_id)
                    min_chunk_by_doc[document_id] = min(
                        min_chunk_by_doc.get(document_id, chunk_index),
                        chunk_index,
                    )
        except NotFoundException:
            return []
        except Exception as exc:  # noqa: BLE001
            raise_if_pinecone_unauthorized(exc)
            logger.warning("Pinecone list failed during document discovery: %s", exc)
            return []

        if not chunk_ids_by_doc:
            return []

        metadata_by_doc: dict[str, dict[str, str]] = {}
        sample_ids = [
            f"{document_id}-{min_chunk_by_doc[document_id]}"
            for document_id in chunk_ids_by_doc
        ]

        for batch_start in range(0, len(sample_ids), 100):
            batch = sample_ids[batch_start : batch_start + 100]
            try:
                fetched = index.fetch(ids=batch, namespace=namespace)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Pinecone fetch failed during document discovery: %s", exc)
                continue
            for vector_id, vector in (fetched.vectors or {}).items():
                document_id = vector_id.rsplit("-", 1)[0]
                meta = vector.metadata or {}
                metadata_by_doc[document_id] = {
                    "title": str(meta.get("title") or "Untitled document"),
                    "source": str(meta.get("source") or "unknown"),
                }

        discovered: list[dict] = []
        for document_id, chunk_ids in chunk_ids_by_doc.items():
            meta = metadata_by_doc.get(document_id, {})
            source = meta.get("source", "unknown")
            discovered.append(
                {
                    "document_id": document_id,
                    "title": meta.get("title", "Untitled document"),
                    "source": source,
                    "chunks": len(chunk_ids),
                    "ingested_at": datetime.now(timezone.utc).isoformat(),
                    "method": "text" if source == "text" else "file",
                }
            )

        return discovered

    def _merge_document_records(
        self,
        manifest_records: list[dict],
        discovered_records: list[dict],
    ) -> list[dict]:
        """Pinecone is the source of truth; manifest only enriches metadata."""
        manifest_by_id = {
            record["document_id"]: record for record in manifest_records
        }
        merged: list[dict] = []

        for record in discovered_records:
            document_id = record["document_id"]
            manifest_entry = manifest_by_id.get(document_id)
            if manifest_entry:
                record = {
                    **record,
                    "title": manifest_entry.get("title") or record.get("title"),
                    "source": manifest_entry.get("source") or record.get("source"),
                    "ingested_at": manifest_entry.get("ingested_at")
                    or record.get("ingested_at"),
                    "method": manifest_entry.get("method") or record.get("method"),
                }
            merged.append(record)

        return sorted(
            merged,
            key=lambda item: item.get("ingested_at", ""),
            reverse=True,
        )

    def _collect_vector_ids_for_document_sync(self, document_id: str) -> list[str]:
        """Return all Pinecone vector ids belonging to a document."""
        try:
            index = self._get_index()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not connect to Pinecone for delete: %s", exc)
            return []

        namespace = settings.PINECONE_NAMESPACE
        prefix = f"{document_id}-"
        ids: list[str] = []

        try:
            for page in index.list(namespace=namespace, limit=100):
                for item in page.vectors or []:
                    if item.id.startswith(prefix):
                        ids.append(item.id)
        except NotFoundException:
            return []
        except Exception as exc:  # noqa: BLE001
            logger.warning("Pinecone list failed while collecting delete ids: %s", exc)
            return []

        return ids

    def _delete_document_sync(self, document_id: str) -> bool:
        """Remove a document's vectors from Pinecone and drop it from the manifest."""
        ids = self._collect_vector_ids_for_document_sync(document_id)
        if ids:
            try:
                self._get_index().delete(
                    ids=ids,
                    namespace=settings.PINECONE_NAMESPACE,
                )
            except Exception as exc:
                raise_if_pinecone_unauthorized(exc)
                raise

        manifest = [
            record
            for record in self._read_manifest()
            if record.get("document_id") != document_id
        ]
        self._write_manifest(manifest)
        return bool(ids)

    def _list_documents_sync(self) -> list[dict]:
        manifest = self._read_manifest()
        discovered = self._discover_documents_from_index_sync()
        merged = self._merge_document_records(manifest, discovered)
        self._write_manifest(merged)
        return merged

    def _search_sync(self, query: str, top_k: int) -> list[PolicyChunk]:
        try:
            response = self._get_index().search(
                namespace=settings.PINECONE_NAMESPACE,
                top_k=top_k,
                inputs={"text": query},
                fields=[_TEXT_FIELD, "title", "source"],
            )
        except NotFoundException:
            # The namespace has no records yet — nothing has been ingested.
            return []
        except Exception as exc:
            raise_if_pinecone_unauthorized(exc)
            raise
        return [
            PolicyChunk(
                id=hit.id,
                text=(hit.fields or {}).get(_TEXT_FIELD, ""),
                title=(hit.fields or {}).get("title"),
                source=(hit.fields or {}).get("source"),
                score=hit.score,
            )
            for hit in response.result.hits
        ]

    async def _run_sync(self, fn, *args):
        try:
            return await asyncio.to_thread(fn, *args)
        except Exception as exc:
            raise_if_pinecone_unauthorized(exc)
            raise

    async def ingest_document(self, title: str, text: str, source: str) -> dict:
        """Chunk a document and upsert it into the knowledge base."""
        return await self._run_sync(self._ingest_sync, title, text, source)

    async def search(self, query: str, top_k: int = 4) -> list[PolicyChunk]:
        """Return the policy passages most relevant to a query."""
        if not query.strip():
            return []
        return await self._run_sync(self._search_sync, query, top_k)

    async def list_documents(self) -> list[dict]:
        """Return metadata for all documents indexed in the knowledge base."""
        return await self._run_sync(self._list_documents_sync)

    async def delete_document(self, document_id: str) -> bool:
        """Delete a document and its vectors from the knowledge base."""
        return await self._run_sync(self._delete_document_sync, document_id)


knowledge_base = KnowledgeBase()
