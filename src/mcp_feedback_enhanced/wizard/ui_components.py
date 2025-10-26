"""UI component helpers for the Wizard workflow.

This module contains helper functions for generating UI-related data structures
and messages to send to the Web UI frontend via WebSocket.
"""

from __future__ import annotations

from typing import Any


def create_stage_progress_data(
    current_stage: str, completed_stages: list[str]
) -> dict[str, Any]:
    """Create stage progress indicator data for UI.

    Args:
        current_stage: Current workflow stage ID
        completed_stages: List of completed stage IDs

    Returns:
        Dictionary with stage progress information for frontend rendering
    """
    stages = [
        "COLLECT_CONTEXT",
        "INSIGHT_CLASSIFICATION",
        "REVIEW_BLUEPRINT",
        "REVIEW_TEST_MATRIX",
        "GENERATE_IMPLEMENTATION",
        "REVIEW_TRACE",
    ]

    return {
        "current": current_stage,
        "completed": completed_stages,
        "all_stages": stages,
    }


def create_mermaid_editor_data(mermaid_source: str, version: int = 1) -> dict[str, Any]:
    """Create Mermaid editor component data.

    Args:
        mermaid_source: Mermaid diagram source code
        version: Version number of the diagram

    Returns:
        Dictionary with Mermaid editor data for frontend
    """
    return {
        "type": "mermaid_editor",
        "source": mermaid_source,
        "version": version,
        "editable": True,
    }
