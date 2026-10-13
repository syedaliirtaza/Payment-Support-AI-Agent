import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { IngestedDocument } from "@/types/knowledge";

type IngestedDocumentCardProps = {
  document: IngestedDocument;
  onDelete: () => void;
};

export function IngestedDocumentCard({
  document,
  onDelete,
}: IngestedDocumentCardProps) {
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-medium text-foreground">{document.title}</h3>
          <p className="text-xs text-muted-foreground">{document.source}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">
            {document.method}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label={`Remove ${document.title}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>{document.chunks} chunks indexed</span>
        <span className="font-mono text-foreground/60">{document.documentId}</span>
        <span>{document.ingestedAt}</span>
      </div>
    </li>
  );
}
