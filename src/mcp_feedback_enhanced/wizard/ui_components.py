"""Reusable Streamlit components for the Wizard workflow.

The concrete UI widgets (blueprint editor, test table, approvals, etc.) will be
implemented in subsequent tasks. For now we expose typed stubs so other modules
can import them without raising errors.
"""

from __future__ import annotations

from typing import Any

import streamlit as st


def render_placeholder(message: str = "Component under construction") -> None:
    """Render a lightweight placeholder component."""

    st.warning(message)


def send_mcp_to_cursor(payload: Any) -> None:
    """Stub for the MCP gateway.

    The concrete integration will arrive in Epic 3 once the workflow engine can
    assemble the final prompt.
    """

    _ = payload
    st.write("MCP gateway stub invoked.")
