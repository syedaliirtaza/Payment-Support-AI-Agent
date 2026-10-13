import type { IngestedDocument } from "@/types/knowledge";

const STORAGE_KEY = "payment-support-knowledge-documents";

export function loadIngestedDocuments(): IngestedDocument[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as IngestedDocument[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveIngestedDocuments(documents: IngestedDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function appendIngestedDocument(document: IngestedDocument): IngestedDocument[] {
  const existing = loadIngestedDocuments().filter(
    (item) => item.documentId !== document.documentId,
  );
  const next = [document, ...existing];
  saveIngestedDocuments(next);
  return next;
}

/** Merge API records with any extra local-only fields from cache. */
export function mergeDocumentLists(
  fromApi: IngestedDocument[],
  fromCache: IngestedDocument[],
): IngestedDocument[] {
  const cacheById = new Map(fromCache.map((doc) => [doc.documentId, doc]));
  return fromApi.map((doc) => {
    const cached = cacheById.get(doc.documentId);
    if (!cached) {
      return doc;
    }
    return {
      ...doc,
      ingestedAt: doc.ingestedAt || cached.ingestedAt,
      method: doc.method ?? cached.method,
    };
  });
}
