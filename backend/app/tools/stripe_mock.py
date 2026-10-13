import asyncio
import uuid

from app.data.customers import CUSTOMER_DATABASE


class MockStripeAPI:
    """In-memory stand-in for the Stripe API, used while developing the agent.

    Mirrors the small slice of Stripe the support agent needs. Network latency
    is simulated so the agent behaves as it would against the real API.
    """

    async def get_customer(self, customer_email: str) -> dict | None:
        """Return the customer's identity for an email, or None if unknown."""
        await asyncio.sleep(0.5)  # simulate network latency
        record = CUSTOMER_DATABASE.get(customer_email)
        if record is None:
            return None
        return {"customer_id": record["customer_id"]}

    async def get_subscriptions(self, customer_id: str) -> list[dict]:
        """Return the subscriptions belonging to a customer id."""
        await asyncio.sleep(0.5)  # simulate network latency
        for record in CUSTOMER_DATABASE.values():
            if record["customer_id"] == customer_id:
                return record["subscriptions"]
        return []

    async def create_refund(self, customer_id: str, amount: float) -> dict:
        """Create a refund for a customer and return the refund record."""
        await asyncio.sleep(0.5)  # simulate network latency
        return {
            "refund_id": f"re_{uuid.uuid4().hex[:16]}",
            "customer_id": customer_id,
            "amount": amount,
            "status": "succeeded",
        }
