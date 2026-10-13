from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class DecisionAction(str, Enum):
    """The action the agent can choose for a ticket."""

    APPROVE_REFUND = "approve_refund"
    DENY_REFUND = "deny_refund"
    ANSWER_QUESTION = "answer_question"
    REQUEST_MORE_INFO = "request_more_info"
    ESCALATE_TO_HUMAN = "escalate_to_human"


class AgentDecision(BaseModel):
    """Structured decision produced by the reasoning step.

    This schema is sent to OpenAI as a structured-output format, so the model
    is constrained to return JSON that matches it exactly.
    """

    model_config = ConfigDict(populate_by_name=True)

    action: DecisionAction = Field(
        description="The single most appropriate action to take on this ticket."
    )
    reasoning: str = Field(
        description="Why this action was chosen, citing the specific company "
        "policy that applies."
    )
    confidence: float = Field(
        description="Confidence in the decision, from 0.0 (unsure) to 1.0 (certain)."
    )
    policy_used: list[str] = Field(
        alias="policyUsed",
        description="Titles of the policy passages that informed this decision; "
        "an empty list if no policy applied.",
    )


class ActionResult(BaseModel):
    """Outcome of executing the agent's decision (e.g. processing a refund)."""

    model_config = ConfigDict(populate_by_name=True)

    executed: bool = Field(description="Whether an action was attempted.")
    success: bool = Field(description="Whether the action completed successfully.")
    detail: str = Field(description="Human-readable summary of what happened.")
    refund_id: str | None = Field(default=None, alias="refundId")
    amount: float | None = None
