import {
  isActionResultEvent,
  isCompleteEvent,
  isDecisionEvent,
  isErrorEvent,
  isPolicyChunksEvent,
  isResponseDeltaEvent,
  isStepEvent,
  parseActionResultEvent,
  parseAgentEvent,
  parseCompleteEvent,
  parseDecisionEvent,
  parsePolicyChunksEvent,
  parseResponseDelta,
} from "@/lib/api/parse-stream-event";
import { isAbortError } from "@/lib/is-abort-error";
import type {
  ActionResult,
  AgentDecision,
  AgentEvent,
  CompleteEvent,
  PolicyChunk,
  ResponseDeltaEvent,
  StepEvent,
} from "@/types/agent";
import type { TicketInput } from "@/types/ticket";

const RESOLVE_ENDPOINT = "/api/v1/tickets/resolve";

/** Paint "running" before "completed" when SSE events arrive in one network chunk. */
const STEP_EVENT_UI_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type StreamTicketHandlers = {
  onStep: (event: StepEvent) => void | Promise<void>;
  onResponseDelta: (event: ResponseDeltaEvent) => void;
  onPolicyChunks?: (chunks: PolicyChunk[]) => void;
  onDecision?: (decision: AgentDecision) => void;
  onActionResult?: (result: ActionResult) => void;
  onTrace: (event: AgentEvent) => void;
  onComplete: (event: CompleteEvent) => void;
  onError: (message: string) => void;
};

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

async function dispatchAgentEvent(
  event: AgentEvent,
  handlers: StreamTicketHandlers,
): Promise<void> {
  handlers.onTrace(event);

  if (isErrorEvent(event)) {
    handlers.onError(event.message);
    return;
  }

  if (isStepEvent(event)) {
    await handlers.onStep(event);
    await delay(STEP_EVENT_UI_DELAY_MS);
    return;
  }

  if (isResponseDeltaEvent(event)) {
    handlers.onResponseDelta(event);
    return;
  }

  if (isPolicyChunksEvent(event)) {
    handlers.onPolicyChunks?.(event.policyChunks);
    return;
  }

  if (isDecisionEvent(event)) {
    handlers.onDecision?.(event.decision);
    return;
  }

  if (isActionResultEvent(event)) {
    handlers.onActionResult?.(event.actionResult);
    return;
  }

  if (isCompleteEvent(event)) {
    handlers.onComplete({
      ...event,
      policyChunks: event.policyChunks ?? [],
      decision: event.decision ?? null,
      actionResult: event.actionResult ?? null,
      customerResponse: event.customerResponse ?? null,
    });
  }
}

async function parseSseChunk(
  chunk: string,
  handlers: StreamTicketHandlers,
): Promise<string> {
  let remainder = chunk;
  const events = remainder.split("\n\n");
  remainder = events.pop() ?? "";

  for (const eventBlock of events) {
    const dataLines = eventBlock
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data:\s?/, ""));

    if (dataLines.length === 0) {
      continue;
    }

    const payload = dataLines.join("\n");
    const trimmed = payload.trim().replace(/^data:\s?/, "");
    if (!trimmed) {
      continue;
    }

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      continue;
    }

    if (raw.type === "complete") {
      await dispatchAgentEvent(parseCompleteEvent(raw), handlers);
      continue;
    }

    const policyChunksEvent = parsePolicyChunksEvent(raw);
    if (policyChunksEvent) {
      await dispatchAgentEvent(policyChunksEvent, handlers);
      continue;
    }

    const decisionEvent = parseDecisionEvent(raw);
    if (decisionEvent) {
      await dispatchAgentEvent(decisionEvent, handlers);
      continue;
    }

    const actionResultEvent = parseActionResultEvent(raw);
    if (actionResultEvent) {
      await dispatchAgentEvent(actionResultEvent, handlers);
      continue;
    }

    const responseDelta = parseResponseDelta(raw);
    if (responseDelta) {
      handlers.onTrace(responseDelta);
      handlers.onResponseDelta(responseDelta);
      continue;
    }

    const event = raw as AgentEvent;
    await dispatchAgentEvent(event, handlers);
  }

  return remainder;
}

export async function streamTicketResolve(
  ticket: TicketInput,
  handlers: StreamTicketHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(RESOLVE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(ticket),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      return;
    }
    throw error;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (contentType.includes("application/json")) {
    const json = (await response.json()) as Record<string, unknown>;
    const event = parseAgentEvent(JSON.stringify({ type: "complete", ...json }));
    if (event && isCompleteEvent(event)) {
      handlers.onComplete(event);
    } else {
      handlers.onComplete({
        type: "complete",
        parsedTicket: null,
        customerData: null,
        policyChunks: [],
        decision: null,
        actionResult: null,
        customerResponse: null,
      });
    }
    return;
  }

  if (!response.body) {
    throw new Error("Streaming response body is empty.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = await parseSseChunk(buffer, handlers);
    }

    if (buffer.trim()) {
      await parseSseChunk(`${buffer}\n\n`, handlers);
    }
  } catch (error) {
    if (isAbortError(error)) {
      return;
    }
    throw error;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // reader may already be released after abort
    }
  }
}
