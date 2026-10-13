from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TicketCategory(str, Enum):
    REFUND = "refund"
    PAYMENT_FAILURE = "payment_failure"
    BILLING_ISSUE = "billing_issue"
    OTHER = "other"


class ParsedTicket(BaseModel):
    """Essential ticket fields the agent extracts for processing."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    message: str
    customer_email: str = Field(alias="customerEmail")
    priority: TicketPriority


class Ticket(BaseModel):
    """Full ticket as shown in the frontend."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    message: str
    customer_email: str = Field(alias="customerEmail")
    created_at: str = Field(alias="createdAt")
    priority: TicketPriority