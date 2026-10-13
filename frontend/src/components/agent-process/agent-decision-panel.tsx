import { formatDecisionAction } from "@/lib/api/parse-stream-event";
import type { AgentDecision, DecisionAction } from "@/types/agent";
import { cn } from "@/lib/utils";

const ACTION_STYLES: Record<DecisionAction, string> = {
  approve_refund: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  deny_refund: "bg-muted text-foreground ring-border",
  answer_question: "bg-sky-50 text-sky-900 ring-sky-200",
  request_more_info: "bg-amber-50 text-amber-900 ring-amber-200",
  escalate_to_human: "bg-orange-50 text-orange-900 ring-orange-200",
};

export function AgentDecisionPanel({ decision }: { decision: AgentDecision | null }) {
  if (!decision) {
    return null;
  }

  const confidencePercent = Math.round(decision.confidence * 100);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Decision
      </p>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
              ACTION_STYLES[decision.action],
            )}
          >
            {formatDecisionAction(decision.action)}
          </span>
          <span className="text-xs text-muted-foreground">
            {confidencePercent}% confidence
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Reasoning</p>
          <p className="text-sm leading-relaxed text-foreground">
            {decision.reasoning}
          </p>
        </div>
        {decision.policyUsed.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Policy cited</p>
            <ul className="space-y-1">
              {decision.policyUsed.map((citation) => (
                <li
                  key={citation}
                  className="text-xs text-muted-foreground before:mr-1.5 before:content-['•']"
                >
                  {citation}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
