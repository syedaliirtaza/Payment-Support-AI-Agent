"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AgentReasoningPanel } from "@/components/agent-process/agent-reasoning-panel";
import { StreamingAgentResponse } from "@/components/agent-process/streaming-agent-response";
import { ThinkingIndicator } from "@/components/agent-process/thinking-indicator";
import { UserMessageBubble } from "@/components/agent-process/user-message-bubble";
import { useTicketStream } from "@/hooks/use-ticket-stream";
import { deriveAgentMessage } from "@/lib/api/parse-stream-event";
import { isAbortError } from "@/lib/is-abort-error";
import { updateTicketById } from "@/lib/tickets-storage";
import { ticketToInput } from "@/lib/ticket-utils";
import type { CompleteEvent } from "@/types/agent";
import type { Ticket } from "@/types/ticket";

type AgentProcessViewProps = {
  ticket: Ticket;
};

export function AgentProcessView({ ticket }: AgentProcessViewProps) {
  const stream = useTicketStream();
  const ticketIdRef = useRef(ticket.id);
  const startRef = useRef(stream.start);
  const cancelRef = useRef(stream.cancel);
  ticketIdRef.current = ticket.id;
  startRef.current = stream.start;
  cancelRef.current = stream.cancel;

  useEffect(() => {
    const ticketId = ticket.id;

    updateTicketById(ticketId, { status: "processing", errorMessage: undefined });

    void startRef
      .current(ticketToInput(ticket), {
        onComplete: (event: CompleteEvent) => {
          if (ticketIdRef.current !== ticketId) {
            return;
          }
          const parsed = event.parsedTicket;
          updateTicketById(ticketId, {
            status: "resolved",
            errorMessage: undefined,
            finalResponse: deriveAgentMessage(event),
            ...(parsed
              ? {
                  parsedResult: parsed,
                  title: parsed.title,
                  message: parsed.message,
                  customerEmail: parsed.customerEmail,
                  priority: parsed.priority,
                }
              : {}),
          });
        },
      })
      .catch((streamError) => {
        if (isAbortError(streamError)) {
          return;
        }
        if (ticketIdRef.current !== ticketId) {
          return;
        }
        updateTicketById(ticketId, {
          status: "error",
          errorMessage:
            streamError instanceof Error
              ? streamError.message
              : "Failed to stream agent response.",
        });
      });

    return () => {
      cancelRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable refs; run once per ticket
  }, [ticket.id]);

  useEffect(() => {
    if (!stream.error) {
      return;
    }
    updateTicketById(ticket.id, {
      status: "error",
      errorMessage: stream.error,
    });
  }, [stream.error, ticket.id]);

  return (
    <div className="space-y-6">
      <Link
        href="/new-tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to tickets
      </Link>

      <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h1 className="text-sm font-medium text-foreground">{ticket.title}</h1>
          <span className="font-mono text-xs text-muted-foreground">
            {ticket.id}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Ticket
            </p>
            <UserMessageBubble
              message={ticket.message}
              customerEmail={ticket.customerEmail}
            />
            {stream.showThinking ? <ThinkingIndicator /> : null}
            <StreamingAgentResponse
              text={stream.agentResponseText}
              isStreaming={stream.isResponseStreaming}
            />
          </div>

          <AgentReasoningPanel
            steps={stream.steps}
            policyChunks={stream.policyChunks}
            decision={stream.decision}
            actionResult={stream.actionResult}
            isLoading={stream.isLoading}
            error={stream.error}
          />
        </div>
      </div>
    </div>
  );
}

