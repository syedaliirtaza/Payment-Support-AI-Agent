from app.agent.state import AgentState
from app.schemas.decision import ActionResult, DecisionAction
from app.tools.stripe_mock import MockStripeAPI

_stripe = MockStripeAPI()


async def execute_action(state: AgentState) -> dict:
    """Carry out an approved action — currently, processing approved refunds."""
    decision = state.decision
    customer = state.customer_data

    # Only approved refunds are routed here, but stay defensive.
    if decision is None or decision.action != DecisionAction.APPROVE_REFUND:
        return {}

    if customer is None or not customer.found or customer.customer_id is None:
        return {
            "action_result": ActionResult(
                executed=False,
                success=False,
                detail="Cannot process the refund — no customer record was found.",
            )
        }

    amount = customer.subscriptions[0].amount if customer.subscriptions else 0.0
    try:
        refund = await _stripe.create_refund(customer.customer_id, amount)
        return {
            "action_result": ActionResult(
                executed=True,
                success=True,
                detail=f"Refund of ${amount:.2f} processed successfully.",
                refund_id=refund["refund_id"],
                amount=amount,
            )
        }
    except Exception as exc:  # noqa: BLE001 — record the failure, don't crash the graph
        return {
            "action_result": ActionResult(
                executed=True,
                success=False,
                detail=f"Refund could not be processed: {exc}",
            )
        }
