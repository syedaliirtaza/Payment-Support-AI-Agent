from langgraph.graph import END, START, StateGraph

from app.agent.nodes.check_subscription import check_subscription
from app.agent.nodes.execute_action import execute_action
from app.agent.nodes.extract import extract_ticket
from app.agent.nodes.generate_response import generate_response
from app.agent.nodes.reason_decide import reason_decide
from app.agent.nodes.retrieve_customer import retrieve_customer
from app.agent.nodes.retrieve_policy import retrieve_policy
from app.agent.state import AgentState
from app.agent.tracing import AgentTraceCallback
from app.schemas.decision import DecisionAction

# Human-readable label for each graph node, shown as a step in the UI.
STEP_LABELS: dict[str, str] = {
    "extract_ticket": "Extracting ticket details",
    "retrieve_customer": "Retrieving customer details",
    "check_subscription": "Checking subscription",
    "retrieve_policy": "Retrieving relevant policy",
    "reason_decide": "Reasoning & deciding",
    "execute_action": "Executing action",
    "generate_response": "Writing support reply",
}


def route_after_decision(state: AgentState) -> str:
    """Route to action execution only when a refund was approved."""
    if state.decision is not None and state.decision.action == DecisionAction.APPROVE_REFUND:
        return "execute_action"
    return "generate_response"


def build_graph():
    """Build and compile the support agent graph.

    The trace callback is attached here so every run logs the graph and
    each node automatically — no logging code is needed inside the nodes.
    """
    builder = StateGraph(AgentState)
    builder.add_node("extract_ticket", extract_ticket)
    builder.add_node("retrieve_customer", retrieve_customer)
    builder.add_node("check_subscription", check_subscription)
    builder.add_node("retrieve_policy", retrieve_policy)
    builder.add_node("reason_decide", reason_decide)
    builder.add_node("execute_action", execute_action)
    builder.add_node("generate_response", generate_response)

    builder.add_edge(START, "extract_ticket")
    builder.add_edge("extract_ticket", "retrieve_customer")
    builder.add_edge("retrieve_customer", "check_subscription")
    builder.add_edge("check_subscription", "retrieve_policy")
    builder.add_edge("retrieve_policy", "reason_decide")
    # Approved refunds run the execution step; every other decision skips it.
    builder.add_conditional_edges(
        "reason_decide",
        route_after_decision,
        ["execute_action", "generate_response"],
    )
    builder.add_edge("execute_action", "generate_response")
    builder.add_edge("generate_response", END)

    compiled = builder.compile()
    return compiled.with_config({"callbacks": [AgentTraceCallback()]})


graph = build_graph()
