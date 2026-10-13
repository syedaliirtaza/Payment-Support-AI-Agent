import type { PolicyChunk } from "@/types/agent";

export function PolicyChunksPanel({ chunks }: { chunks: PolicyChunk[] }) {
  if (chunks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Citations
      </p>
      <ul className="space-y-2">
        {chunks.map((chunk) => (
          <li
            key={chunk.id}
            className="rounded-lg border border-border bg-muted/20 p-3"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {chunk.title ? (
                <span className="text-xs font-medium text-foreground">
                  {chunk.title}
                </span>
              ) : null}
              {chunk.source ? (
                <span className="text-xs text-muted-foreground">
                  {chunk.source}
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {Math.round(chunk.score * 100)}% match
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {chunk.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
