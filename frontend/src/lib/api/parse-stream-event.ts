import type {
  ActionResult,
  ActionResultEvent,
  AgentDecision,
  AgentEvent,
  CompleteEvent,
  CustomerData,
  DecisionAction,
  DecisionEvent,
  ErrorEvent,
  PolicyChunk,
  PolicyChunksEvent,
  ResponseDeltaEvent,
  StepEvent,
} from "@/types/agent";
import type { ParsedTicket, TicketPriority } from "@/types/ticket";

export function parseAgentEvent(raw: string): AgentEvent | null {
  const trimmed = raw.trim().replace(/^data:\s?/, "");
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as AgentEvent;
  } catch {
    return null;
  }
}

export function isStepEvent(event: AgentEvent): event is StepEvent {
  return event.type === "step";
}

export function isCompleteEvent(event: AgentEvent): event is CompleteEvent {
  return event.type === "complete";
}

export function isErrorEvent(event: AgentEvent): event is ErrorEvent {
  return event.type === "error";
}

export function isResponseDeltaEvent(
  event: AgentEvent,
): event is ResponseDeltaEvent {
  return event.type === "response_delta";
}

export function isPolicyChunksEvent(
  event: AgentEvent,
): event is PolicyChunksEvent {
  return event.type === "policy_chunks";
}

export function isDecisionEvent(event: AgentEvent): event is DecisionEvent {
  return event.type === "decision";
}

export function isActionResultEvent(
  event: AgentEvent,
): event is ActionResultEvent {
  return event.type === "action_result";
}

export function parsePolicyChunksEvent(
  data: Record<string, unknown>,
): PolicyChunksEvent | null {
  if (data.type !== "policy_chunks") {
    return null;
  }
  return {
    type: "policy_chunks",
    policyChunks: parsePolicyChunks(data.policyChunks ?? data.policy_chunks),
  };
}

export function parseDecisionEvent(
  data: Record<string, unknown>,
): DecisionEvent | null {
  if (data.type !== "decision") {
    return null;
  }
  const decision = parseAgentDecision(data.decision);
  if (!decision) {
    return null;
  }
  return { type: "decision", decision };
}

export function parseActionResultEvent(
  data: Record<string, unknown>,
): ActionResultEvent | null {
  if (data.type !== "action_result") {
    return null;
  }
  const actionResult = parseActionResult(
    data.actionResult ?? data.action_result,
  );
  if (!actionResult) {
    return null;
  }
  return { type: "action_result", actionResult };
}

export function parseResponseDelta(
  data: Record<string, unknown>,
): ResponseDeltaEvent | null {
  const type = data.type;
  if (type !== "response_delta" && type !== "token" && type !== "response") {
    return null;
  }
  const delta =
    data.delta ?? data.token ?? data.text ?? data.content ?? data.chunk;
  if (typeof delta !== "string" || !delta) {
    return null;
  }
  return { type: "response_delta", delta };
}

export function parsePolicyChunks(value: unknown): PolicyChunk[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const raw = item as Record<string, unknown>;
      return {
        id: String(raw.id ?? ""),
        text: String(raw.text ?? ""),
        title: raw.title != null ? String(raw.title) : null,
        source: raw.source != null ? String(raw.source) : null,
        score: typeof raw.score === "number" ? raw.score : 0,
      };
    })
    .filter((chunk): chunk is PolicyChunk => Boolean(chunk?.id));
}

const DECISION_ACTIONS: DecisionAction[] = [
  "approve_refund",
  "deny_refund",
  "answer_question",
  "request_more_info",
  "escalate_to_human",
];

export function parseAgentDecision(value: unknown): AgentDecision | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const action = raw.action;
  if (typeof action !== "string" || !DECISION_ACTIONS.includes(action as DecisionAction)) {
    return null;
  }
  const policyUsed = raw.policyUsed ?? raw.policy_used;
  const policies = Array.isArray(policyUsed)
    ? policyUsed.map((item) => String(item)).filter(Boolean)
    : [];
  return {
    action: action as DecisionAction,
    reasoning: String(raw.reasoning ?? ""),
    confidence:
      typeof raw.confidence === "number"
        ? Math.min(1, Math.max(0, raw.confidence))
        : 0,
    policyUsed: policies,
  };
}

export function parseActionResult(value: unknown): ActionResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const raw = value as Record<string, unknown>;
  return {
    executed: Boolean(raw.executed),
    success: Boolean(raw.success),
    detail: String(raw.detail ?? ""),
    refundId:
      raw.refundId != null
        ? String(raw.refundId)
        : raw.refund_id != null
          ? String(raw.refund_id)
          : null,
    amount: typeof raw.amount === "number" ? raw.amount : null,
  };
}

export function parseCompleteEvent(data: Record<string, unknown>): CompleteEvent {
  const customerResponse = data.customerResponse ?? data.customer_response;
  return {
    type: "complete",
    parsedTicket: parseParsedTicketFromComplete(data),
    customerData: parseCustomerDataFromComplete(data),
    policyChunks: parsePolicyChunks(
      data.policyChunks ?? data.policy_chunks ?? [],
    ),
    decision: parseAgentDecision(data.decision),
    actionResult: parseActionResult(data.actionResult ?? data.action_result),
    customerResponse:
      typeof customerResponse === "string" && customerResponse.trim()
        ? customerResponse.trim()
        : null,
  };
}

function parseParsedTicketFromComplete(
  data: Record<string, unknown>,
): ParsedTicket | null {
  const raw = data.parsedTicket ?? data.parsed_ticket;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const ticket = raw as Record<string, unknown>;
  return {
    id: String(ticket.id ?? ""),
    title: String(ticket.title ?? ""),
    message: String(ticket.message ?? ""),
    customerEmail: String(ticket.customerEmail ?? ticket.customer_email ?? ""),
    priority: (ticket.priority as TicketPriority) ?? "medium",
  };
}

function parseCustomerDataFromComplete(
  data: Record<string, unknown>,
): CustomerData | null {
  const raw = data.customerData ?? data.customer_data;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const customer = raw as Record<string, unknown>;
  const subscriptions = Array.isArray(customer.subscriptions)
    ? customer.subscriptions
    : [];
  return {
    found: Boolean(customer.found),
    customerId:
      customer.customerId != null
        ? String(customer.customerId)
        : customer.customer_id != null
          ? String(customer.customer_id)
          : null,
    subscriptions: subscriptions.map((sub) => {
      const s = sub as Record<string, unknown>;
      return {
        id: String(s.id ?? ""),
        plan: String(s.plan ?? ""),
        status: String(s.status ?? "active") as "active" | "past_due" | "canceled",
        amount: typeof s.amount === "number" ? s.amount : 0,
        interval: String(s.interval ?? ""),
        currentPeriodEnd: String(
          s.currentPeriodEnd ?? s.current_period_end ?? "",
        ),
      };
    }),
  };
}

export function formatDecisionAction(action: DecisionAction): string {
  const labels: Record<DecisionAction, string> = {
    approve_refund: "Approve refund",
    deny_refund: "Deny refund",
    answer_question: "Answer question",
    request_more_info: "Request more info",
    escalate_to_human: "Escalate to human",
  };
  return labels[action];
}

export function deriveAgentMessage(event: CompleteEvent): string {
  const { parsedTicket, customerData, policyChunks, decision, customerResponse } =
    event;

  if (customerResponse?.trim()) {
    return customerResponse.trim();
  }

  if (decision?.reasoning?.trim()) {
    return decision.reasoning.trim();
  }

  if (parsedTicket?.message?.trim()) {
    return parsedTicket.message.trim();
  }

  if (customerData?.found && customerData.customerId) {
    const subscription = customerData.subscriptions[0];
    if (subscription) {
      return `Found customer ${customerData.customerId} on ${subscription.plan} (${subscription.status}).`;
    }
    return `Found customer ${customerData.customerId}.`;
  }

  if (customerData && !customerData.found) {
    return "No matching customer was found in Stripe.";
  }

  if (policyChunks.length > 0) {
    const top = policyChunks[0];
    const label = top.title ?? top.source ?? "policy";
    return `Retrieved ${policyChunks.length} relevant policy section${policyChunks.length === 1 ? "" : "s"} (top match: ${label}).`;
  }

  return "Ticket processed successfully.";
}
