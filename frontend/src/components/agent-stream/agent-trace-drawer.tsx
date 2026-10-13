import type { AgentEvent } from "@/types/agent";

export function AgentTraceDrawer({ traceData }: { traceData: AgentEvent[] }) {
  if (traceData.length === 0) {
    return null;
  }

  return (
    <details className="rounded-lg border border-border bg-muted/20">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground select-none">
        Behind the scenes
      </summary>
      <div className="max-h-64 overflow-auto border-t border-border px-4 py-3">
        <pre className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify(traceData, null, 2)}
        </pre>
      </div>
    </details>
  );
}
