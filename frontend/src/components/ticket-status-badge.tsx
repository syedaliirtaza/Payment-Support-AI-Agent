import type { TicketStatus } from "@/types/ticket";
import { cn } from "@/lib/utils";

const statusStyles: Record<TicketStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-foreground/5 text-foreground",
  resolved: "border border-border bg-background text-foreground",
  error: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<TicketStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  resolved: "Resolved",
  error: "Error",
};

export function TicketStatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
