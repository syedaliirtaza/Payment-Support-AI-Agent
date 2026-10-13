"use client";

import { useEffect, useState } from "react";

import { TicketCard } from "@/components/ticket-card";
import { loadTickets } from "@/lib/tickets-storage";
import type { Ticket } from "@/types/ticket";

export function NewTicketsView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setTickets(loadTickets());
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <section className="rounded-2xl border border-border bg-card p-8">
        <p className="text-center text-sm text-muted-foreground">
          Loading tickets…
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="New tickets"
      className="rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      {tickets.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No tickets yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard ticket={ticket} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
