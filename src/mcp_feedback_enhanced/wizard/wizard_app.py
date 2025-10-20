"""Streamlit entry point for the Wizard Spec-Then-Code workflow.

The implementation will be introduced in later epics. This placeholder keeps the
module importable and defines a top-level ``main`` function so that developers
can run ``python -m mcp_feedback_enhanced.wizard.wizard_app`` during
development.
"""

from __future__ import annotations

import streamlit as st

from .guide_engine import WorkflowEngine


def main() -> None:
    """Placeholder application entry point."""

    st.title("The Wizard - Spec-Then-Code")
    st.info(
        "Wizard UI scaffolding is under construction."
        " This screen exists to validate module imports."
    )
    WorkflowEngine()


if __name__ == "__main__":
    main()
