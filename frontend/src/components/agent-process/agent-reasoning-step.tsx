import { Check, Loader2 } from "lucide-react";

import type { ChecklistStep } from "@/types/agent";
import { cn } from "@/lib/utils";

export function AgentReasoningStep({ step }: { step: ChecklistStep }) {
  const isRunning = step.status === "running";

  return (
    <li
      className={cn(
        "flex items-center gap-3 animate-step-in",
        isRunning && "opacity-90",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center">
        {isRunning ? (
          <span className="flex size-6 items-center justify-center rounded-full bg-muted">
            <Loader2
              className="size-3.5 animate-spin text-muted-foreground"
              aria-label="In progress"
            />
          </span>
        ) : (
          <span
            className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white animate-check-pop"
            aria-label="Completed"
          >
            <Check className="size-3.5 stroke-[2.5]" />
          </span>
        )}
      </span>
      <p className="min-w-0 flex-1 text-sm text-foreground">{step.label}</p>
    </li>
  );
}
