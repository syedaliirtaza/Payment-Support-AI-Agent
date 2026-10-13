from app.agent.state import AgentState
from app.schemas.customer import Subscription
from app.tools.stripe_mock import MockStripeAPI

_stripe = MockStripeAPI()


async def check_subscription(state: AgentState) -> dict:
    """Fetch the subscriptions for a customer found in the previous step."""
    customer = state.customer_data
    if customer is None or not customer.found or customer.customer_id is None:
        return {}  # no customer to check — nothing to update

    raw_subscriptions = await _stripe.get_subscriptions(customer.customer_id)
    subscriptions = [Subscription(**sub) for sub in raw_subscriptions]

    updated = customer.model_copy(update={"subscriptions": subscriptions})
    return {"customer_data": updated}
