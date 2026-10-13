import type {
  IngestResponse,
  KnowledgeDocumentRecord,
  TextIngestRequest,
} from "@/types/knowledge";

const TEXT_INGEST_ENDPOINT = "/api/v1/knowledge/text";
const FILE_UPLOAD_ENDPOINT = "/api/v1/knowledge/upload";
const DOCUMENTS_ENDPOINT = "/api/v1/knowledge/documents";

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") {
      return body.detail;
    }
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((item) =>
          typeof item === "object" && item && "msg" in item
            ? String((item as { msg: string }).msg)
            : String(item),
        )
        .join(", ");
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

export async function deleteKnowledgeDocument(documentId: string): Promise<void> {
  const response = await fetch(
    `${DOCUMENTS_ENDPOINT}/${encodeURIComponent(documentId)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

export async function listKnowledgeDocuments(): Promise<KnowledgeDocumentRecord[]> {
  const response = await fetch(DOCUMENTS_ENDPOINT, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<KnowledgeDocumentRecord[]>;
}

export async function ingestText(
  payload: TextIngestRequest,
): Promise<IngestResponse> {
  const response = await fetch(TEXT_INGEST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<IngestResponse>;
}

export async function uploadKnowledgeFile(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(FILE_UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<IngestResponse>;
}
