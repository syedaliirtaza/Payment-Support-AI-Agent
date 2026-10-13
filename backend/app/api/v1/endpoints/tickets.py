import asyncio
import json
import time
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.agent.graph import STEP_LABELS, graph
from app.core.config import settings
from app.schemas.ticket import Ticket

router = APIRouter(tags=["tickets"])


def _sse(payload: dict) -> str:
    """Format a dict as a Server-Sent Events message."""
    return f"data: {json.dumps(payload)}\n\n"


def _step(node: str, status: str) -> str:
    """Build an SSE step event for a node ('running' or 'completed')."""
    return _sse(
        {
            "type": "step",
            "id": node,
            "label": STEP_LABELS.get(node, node),
            "status": status,
        }
    )


def _partial_event(event_type: str, payload: dict) -> str:
    """Emit incremental agent output before the final complete event."""
    return _sse({"type": event_type, **payload})


async def _flush_sse_chunk() -> None:
    """Yield to the event loop so proxies/clients can receive the prior SSE chunk."""
    await asyncio.sleep(0)


async def _resolve_events(ticket: Ticket) -> AsyncIterator[str]:
    """Run the agent graph, emitting an SSE event as each node starts and finishes."""
    result: dict = {}
    step_started_at: dict[str, float] = {}
    try:
        async for event in graph.astream_events({"ticket": ticket}, version="v2"):
            node = (event.get("metadata") or {}).get("langgraph_node")
            # Keep only the node-level chain events, not their internals.
            if not node or event["name"] != node:
                continue

            if event["event"] == "on_chain_start":
                step_started_at[node] = time.monotonic()
                yield _step(node, "running")
                await _flush_sse_chunk()
            elif event["event"] == "on_chain_end":
                started = step_started_at.pop(node, time.monotonic())
                remaining = settings.AGENT_STEP_MIN_DURATION_SEC - (
                    time.monotonic() - started
                )
                if remaining > 0:
                    await asyncio.sleep(remaining)

                output = event["data"].get("output")
                if isinstance(output, dict):
                    result.update(output)
                    if node == "retrieve_policy":
                        chunks = output.get("policy_chunks") or []
                        yield _partial_event(
                            "policy_chunks",
                            {
                                "policyChunks": [
                                    chunk.model_dump(mode="json")
                                    for chunk in chunks
                                ],
                            },
                        )
                    elif node == "reason_decide":
                        decision = output.get("decision")
                        if decision is not None:
                            yield _partial_event(
                                "decision",
                                {
                                    "decision": decision.model_dump(
                                        mode="json", by_alias=True
                                    ),
                                },
                            )
                    elif node == "execute_action":
                        action_result = output.get("action_result")
                        if action_result is not None:
                            yield _partial_event(
                                "action_result",
                                {
                                    "actionResult": action_result.model_dump(
                                        mode="json", by_alias=True
                                    ),
                                },
                            )
                    await _flush_sse_chunk()
                yield _step(node, "completed")
                await _flush_sse_chunk()
                if settings.AGENT_STEP_PAUSE_SEC > 0:
                    await asyncio.sleep(settings.AGENT_STEP_PAUSE_SEC)
    except Exception as exc:  # surface failures instead of leaving the stream open
        yield _sse({"type": "error", "message": str(exc)})
        return

    parsed = result.get("parsed_ticket")
    customer = result.get("customer_data")
    policy_chunks = result.get("policy_chunks") or []
    decision = result.get("decision")
    action_result = result.get("action_result")
    yield _sse(
        {
            "type": "complete",
            "parsedTicket": parsed.model_dump(mode="json", by_alias=True) if parsed else None,
            "customerData": customer.model_dump(mode="json", by_alias=True) if customer else None,
            "policyChunks": [chunk.model_dump(mode="json") for chunk in policy_chunks],
            "decision": decision.model_dump(mode="json", by_alias=True) if decision else None,
            "actionResult": action_result.model_dump(mode="json", by_alias=True)
            if action_result
            else None,
            "customerResponse": result.get("customer_response"),
        }
    )


@router.post("/resolve")
async def resolve_ticket(ticket: Ticket) -> StreamingResponse:
    """Receive a ticket and stream the agent's progress as Server-Sent Events."""
    return StreamingResponse(
        _resolve_events(ticket),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
