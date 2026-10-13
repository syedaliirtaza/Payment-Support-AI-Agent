import Link from "next/link";

import { TicketStatusBadge } from "@/components/ticket-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { appButtonClassName } from "@/lib/button-styles";
import { previewMessage } from "@/lib/ticket-utils";
import type { Ticket, TicketPriority } from "@/types/ticket";
import { cn } from "@/lib/utils";

const priorityStyles: Record<TicketPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary text-secondary-foreground",
  high: "bg-foreground/5 text-foreground",
};

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        priorityStyles[priority],
      )}
    >
      {priority}
    </span>
  );
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-none transition-colors hover:bg-muted/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">
              {ticket.title}
            </h3>
            <PriorityBadge priority={ticket.priority} />
            <TicketStatusBadge status={ticket.status} />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {previewMessage(ticket.message)}
          </p>
          <p className="text-xs text-muted-foreground">{ticket.customerEmail}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground sm:items-end">
            <span className="font-mono text-[11px] tracking-wide text-foreground/60">
              {ticket.id}
            </span>
            <span>{ticket.createdAt}</span>
          </div>
          <Link
            href={`/new-tickets/${encodeURIComponent(ticket.id)}`}
            className={cn(buttonVariants({ size: "sm" }), appButtonClassName)}
          >
            Assign to Agent
          </Link>
        </div>
        </div>
    </article>
  );
}
