from app.agent.state import AgentState
from app.core.config import settings
from app.core.openai_client import get_openai_client

_SYSTEM_PROMPT = """You are a payment support representative replying in a \
support ticket thread — not writing a formal email.

Write like a real human agent: direct, warm, and specific to their issue. Use \
plain language and short paragraphs. Start by acknowledging what they reported, \
then explain what we did or will do next.

Do NOT write in email-draft style. Avoid:
- Subject lines, "Dear …", "Hi [Name]," salutations unless the ticket already \
  used their name
- "I hope this email finds you well", "Please do not hesitate to contact us", \
  or other boilerplate
- Placeholders like [Your Name], [Insert Link], or [Company Name]

End with a brief sign-off on its own line: Stackvex.com

Base the reply on the agent decision and outcome below — do not contradict them, \
do not invent policy, and do not mention internal tools or that you are an AI. \
If a refund was processed, say so clearly. If escalated, say a specialist will \
follow up. If you need more info, ask one or two concrete questions."""

_FALLBACK_MESSAGE = (
    "Thanks for getting in touch — we've received your message and someone on "
    "our team will follow up shortly with an update.\n\n"
    "STackvex.com"
)


def _build_context(state: AgentState) -> str:
    """Render the decision and its outcome as the user message for the model."""
    ticket = state.parsed_ticket
    decision = state.decision
    result = state.action_result

    lines = [
        "## Customer Ticket",
        f"Title: {ticket.title}",
        f"Message: {ticket.message}",
        "",
        "## Agent Decision",
        f"Action: {decision.action.value}",
        f"Reasoning: {decision.reasoning}",
        "",
        "## Action Outcome",
    ]
    if result is None:
        lines.append("No action was executed for this decision.")
    elif result.success:
        lines.append(f"Action completed successfully: {result.detail}")
    else:
        lines.append(f"Action did not complete: {result.detail}")

    return "\n".join(lines)


async def generate_response(state: AgentState) -> dict:
    """Draft the final customer-facing reply based on the decision and outcome."""
    context = _build_context(state)

    try:
        completion = await get_openai_client().chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": context},
            ],
            temperature=0.5,
        )
        content = completion.choices[0].message.content
        reply = content.strip() if content else _FALLBACK_MESSAGE
    except Exception:  # noqa: BLE001 — never leave the customer without a reply
        reply = _FALLBACK_MESSAGE

    return {"customer_response": reply}
