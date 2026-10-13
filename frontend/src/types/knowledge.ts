export type TextIngestRequest = {
  title: string;
  content: string;
};

export type IngestResponse = {
  documentId: string;
  title: string;
  source: string;
  chunks: number;
};

export type KnowledgeDocumentRecord = IngestResponse & {
  ingestedAt: string;
  method: "text" | "file";
};

export type IngestedDocument = KnowledgeDocumentRecord;
