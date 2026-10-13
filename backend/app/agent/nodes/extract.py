from app.agent.state import AgentState
from app.schemas.ticket import ParsedTicket


def extract_ticket(state: AgentState) -> dict:
    """Extract the essential ticket fields the agent needs for processing."""
    ticket = state.ticket
    parsed = ParsedTicket(
        id=ticket.id,
        title=ticket.title,
        message=ticket.message,
        customer_email=ticket.customer_email,
        priority=ticket.priority,
    )
    return {"parsed_ticket": parsed}
