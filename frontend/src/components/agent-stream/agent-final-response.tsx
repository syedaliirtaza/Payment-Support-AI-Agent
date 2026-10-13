export function AgentFinalResponse({ message }: { message: string }) {
  return (
    <div className="animate-final-in rounded-2xl border border-border bg-muted/30 px-4 py-3">
      <p className="mb-1 text-xs font-medium text-muted-foreground">Agent reply</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {message}
      </p>
    </div>
  );
}
