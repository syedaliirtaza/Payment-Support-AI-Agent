from app.agent.state import AgentState
from app.schemas.customer import CustomerData
from app.tools.stripe_mock import MockStripeAPI

_stripe = MockStripeAPI()


async def retrieve_customer(state: AgentState) -> dict:
    """Find the customer in Stripe by the ticket's email address."""
    email = state.parsed_ticket.customer_email
    record = await _stripe.get_customer(email)

    if record is None:
        return {"customer_data": CustomerData(found=False)}

    return {"customer_data": CustomerData(found=True, customer_id=record["customer_id"])}
