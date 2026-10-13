import { seedTickets } from "@/lib/seed-tickets";
import { normalizeTicket } from "@/lib/ticket-utils";
import type { Ticket } from "@/types/ticket";

const STORAGE_KEY = "payment-support-tickets";

function normalizeTickets(tickets: Ticket[]): Ticket[] {
  return tickets.map(normalizeTicket);
}

export function loadTickets(): Ticket[] {
  if (typeof window === "undefined") {
    return normalizeTickets(seedTickets);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizeTickets(seedTickets);
    }
    const parsed = JSON.parse(raw) as Ticket[];
    return Array.isArray(parsed) && parsed.length > 0
      ? normalizeTickets(parsed)
      : normalizeTickets(seedTickets);
  } catch {
    return normalizeTickets(seedTickets);
  }
}

export function saveTickets(tickets: Ticket[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

export function getTicketById(ticketId: string): Ticket | null {
  const tickets = loadTickets();
  return tickets.find((ticket) => ticket.id === ticketId) ?? null;
}

export function updateTicketById(
  ticketId: string,
  updates: Partial<Ticket>,
): Ticket | null {
  const tickets = loadTickets();
  const index = tickets.findIndex((ticket) => ticket.id === ticketId);
  if (index === -1) {
    return null;
  }
  const next = [...tickets];
  next[index] = { ...next[index], ...updates };
  saveTickets(next);
  return next[index];
}
