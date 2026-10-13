export type ToolMeta = {
  id: string;
  label: string;
  tooltip: string;
  /** Tailwind classes for the icon badge */
  badgeClassName: string;
  /** Single character or short mark inside the badge */
  mark: string;
};

const DEFAULT_TOOL: ToolMeta = {
  id: "agent",
  label: "Agent",
  tooltip: "Agent processing step",
  badgeClassName: "bg-foreground text-background",
  mark: "AI",
};

const TOOL_REGISTRY: Array<{
  match: (node: string) => boolean;
  meta: ToolMeta;
}> = [
  {
    match: (node) =>
      node.includes("stripe") ||
      node.includes("retrieve_customer") ||
      node.includes("check_subscription") ||
      node.includes("subscription") ||
      node.includes("process_refund") ||
      node.includes("refund"),
    meta: {
      id: "stripe",
      label: "Stripe",
      tooltip: "Queried Stripe Customer API",
      badgeClassName: "bg-[#635bff] text-white",
      mark: "S",
    },
  },
  {
    match: (node) =>
      node.includes("zendesk") ||
      node.includes("send_ticket") ||
      node.includes("send_response") ||
      node.includes("intercom"),
    meta: {
      id: "zendesk",
      label: "Zendesk",
      tooltip: "Queried Zendesk Support API",
      badgeClassName: "bg-[#03363d] text-white",
      mark: "Z",
    },
  },
  {
    match: (node) => node.includes("intercom"),
    meta: {
      id: "intercom",
      label: "Intercom",
      tooltip: "Queried Intercom Conversations API",
      badgeClassName: "bg-[#286efa] text-white",
      mark: "I",
    },
  },
  {
    match: (node) =>
      node.includes("retrieve_policy") ||
      node.includes("policy") ||
      node.includes("knowledge") ||
      node.includes("rag"),
    meta: {
      id: "policy",
      label: "Policy",
      tooltip: "Retrieved relevant payment policy context",
      badgeClassName: "bg-muted text-foreground ring-1 ring-border",
      mark: "P",
    },
  },
  {
    match: (node) =>
      node.includes("extract_ticket") ||
      node.includes("extract") ||
      node.includes("parse"),
    meta: {
      id: "extract",
      label: "Extract",
      tooltip: "Extracted essential ticket fields",
      badgeClassName: "bg-muted text-foreground ring-1 ring-border",
      mark: "Ex",
    },
  },
  {
    match: (node) =>
      node.includes("reason_decide") ||
      node.includes("decide") ||
      node.includes("decision") ||
      node.includes("decline") ||
      node.includes("approve"),
    meta: {
      id: "decision",
      label: "Decision",
      tooltip: "Reasoned over policy and customer context (GPT)",
      badgeClassName: "bg-foreground text-background",
      mark: "AI",
    },
  },
  {
    match: (node) => node.includes("refund") || node.includes("payment"),
    meta: {
      id: "payment",
      label: "Payments",
      tooltip: "Payment or refund action",
      badgeClassName: "bg-foreground/5 text-foreground ring-1 ring-border",
      mark: "$",
    },
  },
  {
    match: (node) => node.includes("escalat") || node.includes("human"),
    meta: {
      id: "escalate",
      label: "Escalation",
      tooltip: "Escalated to human support",
      badgeClassName: "bg-muted text-foreground ring-1 ring-border",
      mark: "↑",
    },
  },
];

export function getToolMeta(nodeName: string): ToolMeta {
  const normalized = nodeName.toLowerCase().replace(/[_-]/g, " ");
  const entry = TOOL_REGISTRY.find((item) => item.match(normalized));
  return entry?.meta ?? DEFAULT_TOOL;
}

export function formatNodeLabel(nodeName: string): string {
  return nodeName
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
