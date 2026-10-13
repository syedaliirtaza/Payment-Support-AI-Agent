export function AgentResponseBubble({ message }: { message: string }) {
  return (
    <div className="animate-final-in rounded-2xl border border-border bg-card p-4 shadow-none">
      <div className="flex gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
          aria-hidden
        >
          //
        </span>
        <p className="text-sm leading-relaxed text-foreground">{message}</p>
      </div>
    </div>
  );
}
