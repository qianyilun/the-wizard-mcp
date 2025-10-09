"""State machine for managing the Spec-Then-Code workflow.

This module currently provides scaffolding that will be expanded in future
iterations as the RIPER-5 workflow is implemented.
"""

from __future__ import annotations

from typing import Any


class WorkflowEngine:
    """Placeholder engine that will orchestrate the RIPER-5 workflow."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self._config: dict[str, Any] = {}
        self._session_data: dict[str, Any] = {}
        self._current_step_id: str | None = None

    def get_current_step_info(self) -> dict[str, Any]:
        """Return basic metadata about the current step."""

        return {}

    def handle_action(
        self, action_id: str, payload: dict[str, Any] | None = None
    ) -> None:
        """Process an action emitted by the UI layer."""

        _ = (action_id, payload)
