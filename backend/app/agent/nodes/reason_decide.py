from app.agent.state import AgentState
from app.core.config import settings
from app.core.openai_client import get_openai_client
from app.schemas.customer import CustomerData
from app.schemas.decision import AgentDecision, DecisionAction
from app.schemas.knowledge import PolicyChunk
from app.schemas.ticket import ParsedTicket

_SYSTEM_PROMPT = """You are the decision engine for a payment support team. \
For each ticket you are given the customer's message, their Stripe billing \
data, and the relevant excerpts from company policy.

Decide the single most appropriate action. You MUST base your decision on the \
company policy excerpts provided — never invent or assume rules that are not \
stated.

Choose exactly one action:
- approve_refund: The policy clearly entitles the customer to a refund and the \
Stripe data supports it.
- deny_refund: The customer is asking for a refund but the policy clearly does \
not allow it in this case.
- answer_question: The ticket is an informational question (not a refund) that \
the policy or billing data lets you answer directly.
- request_more_info: Key information is missing (e.g. the customer was not \
found, or the ticket lacks detail), so you cannot decide yet.
- escalate_to_human: The issue is complex, high-risk, or outside policy — \
payment disputes, chargebacks, fraud, legal matters — or the policy does not \
cover the situation.

Rules:
- If no policy excerpts are provided or none apply, prefer request_more_info \
or escalate_to_human. Never fabricate a policy.
- reasoning: explain the decision and cite the specific policy that applies.
- confidence: 0.0 (unsure) to 1.0 (certain).
- policy_used: list the titles of the policy passages you relied on; an empty \
list if none applied."""


def _build_context(
    ticket: ParsedTicket,
    customer: CustomerData | None,
    policy_chunks: list[PolicyChunk],
) -> str:
    """Render the gathered data as the user message for the model."""
    lines = [
        "## Support Ticket",
        f"Title: {ticket.title}",
        f"Priority: {ticket.priority.value}",
        f"Message: {ticket.message}",
        "",
        "## Customer Billing Data (Stripe)",
    ]
    if customer is None or not customer.found:
        lines.append("No matching customer was found in Stripe for this email.")
    else:
        lines.append(f"Customer ID: {customer.customer_id}")
        if customer.subscriptions:
            for sub in customer.subscriptions:
                lines.append(
                    f"- {sub.plan} | status: {sub.status} | {sub.amount} per "
                    f"{sub.interval} | current period ends {sub.current_period_end}"
                )
        else:
            lines.append("Customer has no subscriptions.")

    lines += ["", "## Relevant Company Policy"]
    if policy_chunks:
        for i, chunk in enumerate(policy_chunks, start=1):
            lines.append(f"[{i}] {chunk.title or 'Untitled'}\n{chunk.text}")
    else:
        lines.append("No relevant policy excerpts were found.")

    return "\n".join(lines)


async def reason_decide(state: AgentState) -> dict:
    """Reason over the gathered data and produce a structured AgentDecision.

    Any failure of the LLM call degrades gracefully to a human escalation,
    so a flaky API never blocks ticket resolution.
    """
    context = _build_context(state.parsed_ticket, state.customer_data, state.policy_chunks)

    try:
        completion = await get_openai_client().chat.completions.parse(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": context},
            ],
            response_format=AgentDecision,
            temperature=0,
        )
        decision = completion.choices[0].message.parsed
        if decision is None:
            raise RuntimeError(
                f"Model returned no decision: {completion.choices[0].message.refusal}"
            )
        return {"decision": decision}
    except Exception:  # noqa: BLE001 — an AI failure must fail gracefully to a human
        return {
            "decision": AgentDecision(
                action=DecisionAction.ESCALATE_TO_HUMAN,
                reasoning="Internal LLM API timeout or failure.",
                confidence=0.0,
                policy_used=[],
            )
        }
