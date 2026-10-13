import type { ParsedTicket, TicketPriority } from "@/types/ticket";

export type { ParsedTicket, TicketPriority };

/** Mirrors the backend's mock Stripe statuses. */
export type SubscriptionStatus = "active" | "past_due" | "canceled";

export type Subscription = {
  id: string;
  plan: string;
  status: SubscriptionStatus;
  amount: number;
  interval: string;
  currentPeriodEnd: string;
};

/** Result of the customer lookup against (mock) Stripe. */
export type CustomerData = {
  found: boolean;
  customerId: string | null;
  subscriptions: Subscription[];
};

/** Graph node ids — stable keys for the checklist UI. */
export type StepId =
  | "extract_ticket"
  | "retrieve_customer"
  | "check_subscription"
  | "retrieve_policy"
  | "reason_decide"
  | "execute_action"
  | "generate_response";

export type DecisionAction =
  | "approve_refund"
  | "deny_refund"
  | "answer_question"
  | "request_more_info"
  | "escalate_to_human";

export type AgentDecision = {
  action: DecisionAction;
  reasoning: string;
  confidence: number;
  policyUsed: string[];
};

export type ActionResult = {
  executed: boolean;
  success: boolean;
  detail: string;
  refundId: string | null;
  amount: number | null;
};

export type PolicyChunk = {
  id: string;
  text: string;
  title: string | null;
  source: string | null;
  score: number;
};

export type StepStatus = "running" | "completed";

/** Emitted as each agent step starts and finishes. */
export type StepEvent = {
  type: "step";
  id: StepId;
  label: string;
  status: StepStatus;
};

/** Final event — carries the agent's result. */
export type CompleteEvent = {
  type: "complete";
  parsedTicket: ParsedTicket | null;
  customerData: CustomerData | null;
  policyChunks: PolicyChunk[];
  decision: AgentDecision | null;
  actionResult: ActionResult | null;
  customerResponse: string | null;
};

/** Incremental customer reply text while the agent drafts (SSE). */
export type ResponseDeltaEvent = {
  type: "response_delta";
  delta: string;
};

/** Policy passages retrieved for the ticket (streamed after retrieve_policy). */
export type PolicyChunksEvent = {
  type: "policy_chunks";
  policyChunks: PolicyChunk[];
};

/** Structured decision (streamed after reason_decide). */
export type DecisionEvent = {
  type: "decision";
  decision: AgentDecision;
};

/** Outcome of refund execution (streamed after execute_action). */
export type ActionResultEvent = {
  type: "action_result";
  actionResult: ActionResult;
};

/** Emitted if the agent run fails; the stream ends after this. */
export type ErrorEvent = {
  type: "error";
  message: string;
};

export type AgentEvent =
  | StepEvent
  | CompleteEvent
  | ResponseDeltaEvent
  | PolicyChunksEvent
  | DecisionEvent
  | ActionResultEvent
  | ErrorEvent;

/** Display order for known checklist steps. */
export const STEP_DISPLAY_ORDER: StepId[] = [
  "extract_ticket",
  "retrieve_customer",
  "check_subscription",
  "retrieve_policy",
  "reason_decide",
  "execute_action",
  "generate_response",
];

export type StepChecklistEntry = {
  label: string;
  status: StepStatus;
};

/** Checklist state keyed by step id (extend keys when backend adds nodes). */
export type StepChecklist = Record<string, StepChecklistEntry>;

export type ChecklistStep = {
  id: string;
  label: string;
  status: StepStatus;
};
