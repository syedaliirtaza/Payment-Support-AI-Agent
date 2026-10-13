"use client";

import { cn } from "@/lib/utils";

type StreamingAgentResponseProps = {
  text: string;
  isStreaming: boolean;
};

export function StreamingAgentResponse({
  text,
  isStreaming,
}: StreamingAgentResponseProps) {
  if (!text && !isStreaming) {
    return null;
  }

  return (
    <div className="animate-final-in rounded-2xl border border-border bg-card p-4 shadow-none">
      <div className="flex gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
          aria-hidden
        >
          SV
        </span>
        <p className="min-w-0 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {text}
          {isStreaming ? (
            <span
              className={cn(
                "ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 align-middle",
                "animate-pulse bg-foreground",
              )}
              aria-hidden
            />
          ) : null}
        </p>
      </div>
    </div>
  );
}
