import logging
import time
from typing import Any
from uuid import UUID

from langchain_core.callbacks import BaseCallbackHandler

logger = logging.getLogger("agent.trace")

_MAX_VALUE_LEN = 400


def _fmt(value: Any) -> str:
    """Render a callback input/output compactly for a single log line."""
    text = repr(value)
    return text if len(text) <= _MAX_VALUE_LEN else text[:_MAX_VALUE_LEN] + "…"


class AgentTraceCallback(BaseCallbackHandler):
    """Logs each LangGraph run (the graph and every node) as an indented trace.

    Works like a local, free version of LangSmith: nodes log their own
    start/inputs/outputs/latency automatically, so no logging code lives
    inside the nodes themselves.
    """

    def __init__(self) -> None:
        self._runs: dict[UUID, dict[str, Any]] = {}

    def _depth(self, parent_run_id: UUID | None) -> int:
        if parent_run_id and parent_run_id in self._runs:
            return self._runs[parent_run_id]["depth"] + 1
        return 0

    def on_chain_start(
        self,
        serialized: dict[str, Any] | None,
        inputs: dict[str, Any],
        *,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> None:
        name = kwargs.get("name") or "chain"
        kind = "node" if (metadata or {}).get("langgraph_node") else "graph"
        depth = self._depth(parent_run_id)
        self._runs[run_id] = {
            "name": name,
            "kind": kind,
            "depth": depth,
            "start": time.perf_counter(),
        }
        pad = "  " * depth
        logger.info("%s> %s '%s' started | inputs=%s", pad, kind, name, _fmt(inputs))

    def on_chain_end(
        self,
        outputs: dict[str, Any],
        *,
        run_id: UUID,
        **kwargs: Any,
    ) -> None:
        run = self._runs.pop(run_id, None)
        if run is None:
            return
        elapsed_ms = (time.perf_counter() - run["start"]) * 1000
        pad = "  " * run["depth"]
        logger.info(
            "%s< %s '%s' ok (%.1fms) | outputs=%s",
            pad,
            run["kind"],
            run["name"],
            elapsed_ms,
            _fmt(outputs),
        )

    def on_chain_error(
        self,
        error: BaseException,
        *,
        run_id: UUID,
        **kwargs: Any,
    ) -> None:
        run = self._runs.pop(run_id, None)
        if run is None:
            return
        elapsed_ms = (time.perf_counter() - run["start"]) * 1000
        pad = "  " * run["depth"]
        logger.error(
            "%s! %s '%s' failed (%.1fms) | %s: %s",
            pad,
            run["kind"],
            run["name"],
            elapsed_ms,
            type(error).__name__,
            error,
        )
