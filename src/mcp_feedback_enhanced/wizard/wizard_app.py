"""The Wizard workflow application - Web UI based entry point.

This module is deprecated. The Wizard now uses FastAPI + WebSocket based Web UI
integrated with the MCP server. See wizard/manager.py for the main entry point.
"""

from __future__ import annotations


def main() -> None:
    """Deprecated entry point - use MCP tool wizard_start instead."""
    print("The Wizard now runs as part of the MCP server.")
    print("Please use the 'wizard_start' MCP tool from Cursor.")
    print("See docs/wizard/user-guide.md for usage instructions.")


if __name__ == "__main__":
    main()
