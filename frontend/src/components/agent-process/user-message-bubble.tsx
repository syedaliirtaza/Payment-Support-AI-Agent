import { User } from "lucide-react";

type UserMessageBubbleProps = {
  message: string;
  customerEmail?: string;
};

export function UserMessageBubble({
  message,
  customerEmail,
}: UserMessageBubbleProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-none">
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          {customerEmail ? (
            <p className="text-xs text-muted-foreground">{customerEmail}</p>
          ) : null}
          <p className="text-sm leading-relaxed text-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
