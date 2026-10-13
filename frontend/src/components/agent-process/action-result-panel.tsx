import type { ActionResult } from "@/types/agent";
import { cn } from "@/lib/utils";

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

export function ActionResultPanel({
  actionResult,
}: {
  actionResult: ActionResult | null;
}) {
  if (!actionResult) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Action taken
      </p>
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
              actionResult.success
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-destructive/10 text-destructive ring-destructive/20",
            )}
          >
            {actionResult.executed
              ? actionResult.success
                ? "Executed"
                : "Failed"
              : "Not executed"}
          </span>
        </div>
        {actionResult.detail ? (
          <p className="text-sm text-foreground">{actionResult.detail}</p>
        ) : null}
        {actionResult.refundId ? (
          <p className="font-mono text-xs text-muted-foreground">
            Refund: {actionResult.refundId}
          </p>
        ) : null}
        {actionResult.amount != null ? (
          <p className="text-sm text-muted-foreground">
            Amount: {formatAmount(actionResult.amount)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
