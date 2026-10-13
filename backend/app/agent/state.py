from pydantic import BaseModel, Field

from app.schemas.customer import CustomerData
from app.schemas.decision import ActionResult, AgentDecision
from app.schemas.knowledge import PolicyChunk
from app.schemas.ticket import ParsedTicket, Ticket


class AgentState(BaseModel):
    """State passed between nodes of the support agent graph."""

    ticket: Ticket
    parsed_ticket: ParsedTicket | None = None
    customer_data: CustomerData | None = None
    policy_chunks: list[PolicyChunk] = Field(default_factory=list)
    decision: AgentDecision | None = None
    action_result: ActionResult | None = None
    customer_response: str | None = None
