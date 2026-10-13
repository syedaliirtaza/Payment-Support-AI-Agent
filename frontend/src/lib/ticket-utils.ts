import type { Ticket, TicketInput } from "@/types/ticket";

export function generateTicketId(): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${suffix}`;
}

export function formatCreatedAt(date: Date = new Date()): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function buildTicketInput(
  fields: Omit<TicketInput, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): TicketInput {
  return {
    id: fields.id ?? generateTicketId(),
    createdAt: fields.createdAt ?? formatCreatedAt(),
    title: fields.title.trim(),
    message: fields.message.trim(),
    customerEmail: fields.customerEmail.trim(),
    priority: fields.priority,
  };
}

export function ticketToInput(ticket: Ticket): TicketInput {
  return {
    id: ticket.id,
    title: ticket.title,
    message: ticket.message,
    customerEmail: ticket.customerEmail,
    createdAt: ticket.createdAt,
    priority: ticket.priority,
  };
}

export function normalizeTicket(ticket: Ticket): Ticket {
  return {
    ...ticket,
    status: ticket.status ?? "pending",
  };
}

export function previewMessage(message: string, maxLength = 120): string {
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.slice(0, maxLength).trimEnd()}…`;
}
