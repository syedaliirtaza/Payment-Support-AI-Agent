import { ActionResultPanel } from "@/components/agent-process/action-result-panel";
import { AgentDecisionPanel } from "@/components/agent-process/agent-decision-panel";
import { AgentReasoningStep } from "@/components/agent-process/agent-reasoning-step";
import { PolicyChunksPanel } from "@/components/agent-process/policy-chunks-panel";
import type {
  ActionResult,
  AgentDecision,
  ChecklistStep,
  PolicyChunk,
} from "@/types/agent";

type AgentReasoningPanelProps = {
  steps: ChecklistStep[];
  policyChunks: PolicyChunk[];
  decision: AgentDecision | null;
  actionResult: ActionResult | null;
  isLoading: boolean;
  error: string | null;
};

export function AgentReasoningPanel({
  steps,
  policyChunks,
  decision,
  actionResult,
  isLoading,
  error,
}: AgentReasoningPanelProps) {
  const isRetrievingPolicy = steps.some(
    (step) => step.id === "retrieve_policy" && step.status === "running",
  );
  const isDeciding = steps.some(
    (step) => step.id === "reason_decide" && step.status === "running",
  );
  const showThinking =
    isLoading &&
    !decision &&
    (isDeciding || (isRetrievingPolicy && policyChunks.length === 0));

  return (
    <div className="space-y-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Agent reasoning
      </p>

      {steps.length > 0 ? (
        <ul className="space-y-3" aria-live="polite">
          {steps.map((step) => (
            <AgentReasoningStep key={step.id} step={step} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Steps will appear here as the agent works.
        </p>
      )}

      {showThinking ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3">
          <p className="text-sm text-muted-foreground animate-pulse">
            {isDeciding
              ? "Reviewing billing data and policy documents to choose the best action…"
              : "Searching the knowledge base for relevant policy passages…"}
          </p>
        </div>
      ) : null}

      <PolicyChunksPanel chunks={policyChunks} />
      <AgentDecisionPanel decision={decision} />
      <ActionResultPanel actionResult={actionResult} />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
