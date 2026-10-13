"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AgentProcessView } from "@/components/agent-process/agent-process-view";
import { getTicketById } from "@/lib/tickets-storage";
import type { Ticket } from "@/types/ticket";

export function AgentProcessPageClient({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setTicket(getTicketById(ticketId));
    setIsHydrated(true);
  }, [ticketId]);

  if (!isHydrated) {
    return (
      <p className="text-center text-sm text-muted-foreground">Loading ticket…</p>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">Ticket not found.</p>
        <Link href="/new-tickets" className="text-sm text-foreground underline">
          Back to tickets
        </Link>
      </div>
    );
  }

  return <AgentProcessView ticket={ticket} />;
}
