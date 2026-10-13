export type TicketPriority = "low" | "medium" | "high";

/** Payload sent to POST /api/v1/tickets/resolve */
export type TicketInput = {
  id: string;
  title: string;
  message: string;
  customerEmail: string;
  createdAt: string;
  priority: TicketPriority;
};

/** Response from the resolve endpoint */
export type ParsedTicket = {
  id: string;
  title: string;
  message: string;
  customerEmail: string;
  priority: TicketPriority;
};

export type TicketStatus = "pending" | "processing" | "resolved" | "error";

/** Ticket shown in the UI */
export type Ticket = ParsedTicket & {
  createdAt: string;
  status: TicketStatus;
  errorMessage?: string;
  parsedResult?: ParsedTicket;
  finalResponse?: string;
};
