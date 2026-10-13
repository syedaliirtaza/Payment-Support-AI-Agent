"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";

import { IngestedDocumentCard } from "@/components/knowledgebase/ingested-document-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteKnowledgeDocument,
  ingestText,
  listKnowledgeDocuments,
  uploadKnowledgeFile,
} from "@/lib/api/knowledge";
import { appButtonClassName } from "@/lib/button-styles";
import {
  appendIngestedDocument,
  saveIngestedDocuments,
} from "@/lib/knowledge-storage";
import type {
  IngestedDocument,
  IngestResponse,
  KnowledgeDocumentRecord,
} from "@/types/knowledge";
import { cn } from "@/lib/utils";

const ACCEPTED_FILE_TYPES =
  ".pdf,.txt,.md,.json,application/pdf,text/plain,text/markdown,application/json";

type IngestMode = "text" | "file";

function formatIngestedAt(date: Date = new Date()) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatIngestedAtFromIso(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return formatIngestedAt(parsed);
}

function mapApiDocument(record: KnowledgeDocumentRecord): IngestedDocument {
  return {
    documentId: record.documentId,
    title: record.title,
    source: record.source,
    chunks: record.chunks,
    ingestedAt: formatIngestedAtFromIso(record.ingestedAt),
    method: record.method === "file" ? "file" : "text",
  };
}

export function KnowledgebaseView() {
  const [mode, setMode] = useState<IngestMode>("text");
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      try {
        const fromApi = await listKnowledgeDocuments();
        if (cancelled) {
          return;
        }
        const mapped = fromApi.map(mapApiDocument);
        setDocuments(mapped);
        saveIngestedDocuments(mapped);
        setLoadError(null);
      } catch {
        if (cancelled) {
          return;
        }
        setDocuments([]);
        setLoadError(
          "Could not load indexed documents from the server. Check that the backend is running.",
        );
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    }

    void loadDocuments();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshDocuments = useCallback(async () => {
    const fromApi = await listKnowledgeDocuments();
    const mapped = fromApi.map(mapApiDocument);
    setDocuments(mapped);
    saveIngestedDocuments(mapped);
    setLoadError(null);
    return mapped;
  }, []);

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      setError(null);
      setSuccess(null);
      try {
        await deleteKnowledgeDocument(documentId);
        const mapped = await refreshDocuments();
        if (mapped.length === 0) {
          setSuccess("Document removed. The knowledge base is empty.");
        } else {
          setSuccess("Document removed from Pinecone.");
        }
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete document.",
        );
      }
    },
    [refreshDocuments],
  );

  const handleIngestSuccess = useCallback(
    async (response: IngestResponse, method: IngestedDocument["method"]) => {
      try {
        await refreshDocuments();
      } catch {
        const entry: IngestedDocument = {
          ...response,
          ingestedAt: formatIngestedAt(),
          method,
        };
        setDocuments(appendIngestedDocument(entry));
      }
      setSuccess(`Indexed "${response.title}" (${response.chunks} chunks).`);
      setError(null);
    },
    [refreshDocuments],
  );

  async function handleTextSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ingestText({
        title: title.trim(),
        content: content.trim(),
      });
      handleIngestSuccess(response, "text");
      setTitle("");
      setContent("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to ingest text.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a PDF, TXT, MD, or JSON file to upload.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await uploadKnowledgeFile(file);
      handleIngestSuccess(response, "file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to upload file.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isHydrated) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Loading knowledgebase…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-sm font-medium text-foreground">Knowledgebase</h1>
        <p className="text-sm text-muted-foreground">
          Add payment policy documents for the RAG pipeline. Supported uploads:
          text, JSON, PDF, TXT, and Markdown.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-5 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "text" ? "default" : "outline"}
            className={cn(mode === "text" && appButtonClassName)}
            onClick={() => setMode("text")}
          >
            Paste text
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "file" ? "default" : "outline"}
            className={cn(mode === "file" && appButtonClassName)}
            onClick={() => setMode("file")}
          >
            Upload file
          </Button>
        </div>

        {mode === "text" ? (
          <form onSubmit={handleTextSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="kb-title">Title</Label>
              <Input
                id="kb-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Refund policy"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kb-content">Content</Label>
              <Textarea
                id="kb-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste policy text here…"
                rows={8}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className={cn(appButtonClassName)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Processing…
                  </>
                ) : (
                  "Ingest text"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleFileSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="kb-file">Document file</Label>
              <Input
                id="kb-file"
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                PDF, TXT, MD, or JSON — processed and chunked by the backend.
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className={cn(appButtonClassName)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <FileUp />
                    Upload & ingest
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 text-sm text-foreground" role="status">
            {success}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Indexed documents
        </p>
        {loadError ? (
          <p className="text-sm text-muted-foreground" role="status">
            {loadError}
          </p>
        ) : null}
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8">
            <p className="text-center text-sm text-muted-foreground">
              No documents yet. Ingest your first policy above.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {documents.map((document) => (
              <IngestedDocumentCard
                key={document.documentId}
                document={document}
                onDelete={() => handleDeleteDocument(document.documentId)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
