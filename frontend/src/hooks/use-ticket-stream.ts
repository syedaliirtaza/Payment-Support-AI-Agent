"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { checklistToArray, upsertChecklistStep } from "@/lib/agent-checklist";
import { deriveAgentMessage } from "@/lib/api/parse-stream-event";
import { streamTicketResolve } from "@/lib/api/stream-tickets";
import { isAbortError } from "@/lib/is-abort-error";
import { runTypewriter, type TypewriterHandle } from "@/lib/typewriter";
import type {
  ActionResult,
  AgentDecision,
  AgentEvent,
  CompleteEvent,
  PolicyChunk,
  StepChecklist,
} from "@/types/agent";
import type { TicketInput } from "@/types/ticket";

function swallowAbort(promise: Promise<void>) {
  void promise.catch((error: unknown) => {
    if (!isAbortError(error)) {
      console.error(error);
    }
  });
}

function resolveReplyText(event: CompleteEvent): string {
  return (
    event.customerResponse?.trim() ||
    deriveAgentMessage(event).trim() ||
    ""
  );
}

export function useTicketStream() {
  const [isLoading, setIsLoading] = useState(false);
  const [stepChecklist, setStepChecklist] = useState<StepChecklist>({});
  const [finalResponse, setFinalResponse] = useState<string | null>(null);
  const [traceData, setTraceData] = useState<AgentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [completeEvent, setCompleteEvent] = useState<CompleteEvent | null>(null);
  const [policyChunks, setPolicyChunks] = useState<PolicyChunk[]>([]);
  const [decision, setDecision] = useState<AgentDecision | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [customerResponse, setCustomerResponse] = useState<string | null>(null);
  const [agentResponseText, setAgentResponseText] = useState("");
  const [isTypingResponse, setIsTypingResponse] = useState(false);

  const steps = useMemo(
    () => checklistToArray(stepChecklist),
    [stepChecklist],
  );

  const abortRef = useRef<AbortController | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);
  const generationRef = useRef(0);
  const typewriterRef = useRef<TypewriterHandle | null>(null);
  const receivedDeltaRef = useRef(false);

  const cancelTypewriter = useCallback(() => {
    typewriterRef.current?.cancel();
    typewriterRef.current = null;
    setIsTypingResponse(false);
  }, []);

  const startTypewriter = useCallback(
    (fullText: string, generation: number) => {
      cancelTypewriter();
      if (!fullText) {
        return;
      }
      setIsTypingResponse(true);
      setAgentResponseText("");
      typewriterRef.current = runTypewriter(
        fullText,
        (visible) => {
          if (generation !== generationRef.current) {
            return;
          }
          setAgentResponseText(visible);
        },
        () => {
          if (generation !== generationRef.current) {
            return;
          }
          setIsTypingResponse(false);
          typewriterRef.current = null;
        },
      );
    },
    [cancelTypewriter],
  );

  const cancel = useCallback(() => {
    generationRef.current += 1;
    cancelTypewriter();

    const controller = abortRef.current;
    const inflight = inflightRef.current;

    abortRef.current = null;
    inflightRef.current = null;

    if (controller) {
      controller.abort();
    }

    if (inflight) {
      swallowAbort(inflight);
    }
  }, [cancelTypewriter]);

  const reset = useCallback(() => {
    cancel();
    setIsLoading(false);
    setStepChecklist({});
    setFinalResponse(null);
    setTraceData([]);
    setError(null);
    setCompleteEvent(null);
    setPolicyChunks([]);
    setDecision(null);
    setActionResult(null);
    setCustomerResponse(null);
    setAgentResponseText("");
    receivedDeltaRef.current = false;
  }, [cancel]);

  const start = useCallback(
    async (
      ticket: TicketInput,
      callbacks?: {
        onComplete?: (event: CompleteEvent) => void;
      },
    ) => {
      if (inflightRef.current) {
        cancel();
      }

      const generation = generationRef.current;
      setIsLoading(true);
      setError(null);
      setStepChecklist({});
      setFinalResponse(null);
      setTraceData([]);
      setCompleteEvent(null);
      setPolicyChunks([]);
      setDecision(null);
      setActionResult(null);
      setCustomerResponse(null);
      setAgentResponseText("");
      receivedDeltaRef.current = false;
      cancelTypewriter();

      const controller = new AbortController();
      abortRef.current = controller;

      const run = async (): Promise<void> => {
        await streamTicketResolve(
          ticket,
          {
            onStep: (event) => {
              if (generation !== generationRef.current) {
                return;
              }
              setStepChecklist((previous) =>
                upsertChecklistStep(previous, {
                  id: event.id,
                  label: event.label,
                  status: event.status,
                }),
              );
            },
            onResponseDelta: (event) => {
              if (generation !== generationRef.current) {
                return;
              }
              receivedDeltaRef.current = true;
              cancelTypewriter();
              setAgentResponseText((previous) => previous + event.delta);
            },
            onPolicyChunks: (chunks) => {
              if (generation !== generationRef.current) {
                return;
              }
              setPolicyChunks(chunks);
            },
            onDecision: (nextDecision) => {
              if (generation !== generationRef.current) {
                return;
              }
              setDecision(nextDecision);
            },
            onActionResult: (result) => {
              if (generation !== generationRef.current) {
                return;
              }
              setActionResult(result);
            },
            onTrace: (event) => {
              if (generation !== generationRef.current) {
                return;
              }
              setTraceData((previous) => [...previous, event]);
            },
            onComplete: (event) => {
              if (generation !== generationRef.current) {
                return;
              }
              setCompleteEvent(event);
              setPolicyChunks(event.policyChunks);
              setDecision(event.decision);
              setActionResult(event.actionResult);
              setCustomerResponse(event.customerResponse);
              const replyText = resolveReplyText(event);
              setFinalResponse(replyText || null);

              if (receivedDeltaRef.current) {
                cancelTypewriter();
                setAgentResponseText(replyText);
              } else if (replyText) {
                startTypewriter(replyText, generation);
              }

              setIsLoading(false);
              abortRef.current = null;
              callbacks?.onComplete?.(event);
            },
            onError: (message) => {
              if (generation !== generationRef.current) {
                return;
              }
              setError(message);
              setIsLoading(false);
              cancelTypewriter();
              abortRef.current = null;
            },
          },
          controller.signal,
        );

        if (
          generation === generationRef.current &&
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      };

      const inflight = run();
      inflightRef.current = inflight;

      try {
        await inflight;
      } catch (streamError) {
        if (isAbortError(streamError) || controller.signal.aborted) {
          return;
        }
        if (generation !== generationRef.current) {
          return;
        }
        setError(
          streamError instanceof Error
            ? streamError.message
            : "Failed to stream agent response.",
        );
        setIsLoading(false);
        cancelTypewriter();
        abortRef.current = null;
      } finally {
        if (inflightRef.current === inflight) {
          inflightRef.current = null;
        }
      }
    },
    [cancel, cancelTypewriter, startTypewriter],
  );

  const isResponseStreaming =
    isTypingResponse || (isLoading && receivedDeltaRef.current);

  const showThinking =
    isLoading && !agentResponseText && !isTypingResponse;

  return {
    isLoading,
    steps,
    stepChecklist,
    finalResponse,
    traceData,
    error,
    completeEvent,
    policyChunks,
    decision,
    actionResult,
    customerResponse,
    agentResponseText,
    isResponseStreaming,
    showThinking,
    start,
    reset,
    cancel,
  };
}
