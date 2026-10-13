from app.agent.state import AgentState
from app.rag.knowledge_base import knowledge_base


async def retrieve_policy(state: AgentState) -> dict:
    """Retrieve company-policy passages relevant to the ticket."""
    ticket = state.parsed_ticket
    query = f"{ticket.title}\n\n{ticket.message}"
    chunks = await knowledge_base.search(query, top_k=4)
    return {"policy_chunks": chunks}
