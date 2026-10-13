from pydantic import BaseModel, ConfigDict, Field


class Subscription(BaseModel):
    """A single Stripe subscription belonging to a customer."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    plan: str
    status: str
    amount: float
    interval: str
    current_period_end: str = Field(alias="currentPeriodEnd")


class CustomerData(BaseModel):
    """Result of looking a customer up in Stripe."""

    model_config = ConfigDict(populate_by_name=True)

    found: bool
    customer_id: str | None = Field(default=None, alias="customerId")
    subscriptions: list[Subscription] = Field(default_factory=list)
