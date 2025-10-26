#!/usr/bin/env python3
"""
Wizard Routes
=============

FastAPI routes for The Wizard workflow UI.
"""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from ...debug import web_debug_log as debug_log
from ...wizard.manager import get_wizard_manager


# Setup router
router = APIRouter(prefix="", tags=["wizard"])

# Setup templates
templates = Jinja2Templates(directory="src/mcp_feedback_enhanced/web/templates")


@router.get("/wizard", response_class=HTMLResponse)
async def wizard_page(request: Request) -> HTMLResponse:
    """Serve the wizard UI page.

    Args:
        request: FastAPI request object

    Returns:
        HTML response with wizard UI
    """
    debug_log("[WIZARD] Serving wizard UI page")

    wizard_manager = get_wizard_manager()
    session = wizard_manager.get_current_session()

    context = {
        "request": request,
        "session_id": session.session_id if session else None,
        "has_session": session is not None,
    }

    return templates.TemplateResponse("wizard.html", context)


@router.websocket("/ws/wizard")
async def wizard_websocket(websocket: WebSocket) -> None:
    """WebSocket endpoint for wizard real-time communication.

    Args:
        websocket: WebSocket connection
    """
    await websocket.accept()
    debug_log("[WIZARD] WebSocket connection accepted")

    wizard_manager = get_wizard_manager()
    session = wizard_manager.get_current_session()

    if not session:
        debug_log("[WIZARD] No active session, closing connection")
        await websocket.send_json(
            {
                "type": "error",
                "message": "No active wizard session. Please call wizard_start MCP tool first.",
            }
        )
        await websocket.close()
        return

    # Attach WebSocket to session
    session.websocket = websocket

    try:
        # Send session info to client
        await websocket.send_json(
            {
                "type": "session_info",
                "session_id": session.session_id,
                "current_stage": session.current_stage,
                "status": session.status.value,
                "blueprint_text": session.blueprint_text,
                "completed_stages": session.completed_stages,
                "routine_id": session.routine_id,
            }
        )

        debug_log(f"[WIZARD] WebSocket connected to session {session.session_id}")

        # Message handling loop
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message = json.loads(data)

                debug_log(f"[WIZARD] Received message: {message.get('type')}")

                # Handle message
                response = await wizard_manager.handle_wizard_message(message, session)

                # Send response if any
                if response:
                    await websocket.send_json(response)

            except WebSocketDisconnect:
                debug_log(
                    f"[WIZARD] WebSocket disconnected from session {session.session_id}"
                )
                break

            except json.JSONDecodeError as e:
                debug_log(f"[WIZARD] JSON decode error: {e}")
                await websocket.send_json(
                    {"type": "error", "message": "Invalid JSON format"}
                )

            except Exception as e:
                debug_log(f"[WIZARD] Error handling message: {e}")
                await websocket.send_json({"type": "error", "message": str(e)})

    except Exception as e:
        debug_log(f"[WIZARD] WebSocket error: {e}")

    finally:
        # Clean up
        if session and session.websocket == websocket:
            session.websocket = None
        debug_log("[WIZARD] WebSocket connection closed")


@router.get("/api/wizard/status")
async def wizard_status() -> dict[str, Any]:
    """Get current wizard session status.

    Returns:
        Session status information
    """
    wizard_manager = get_wizard_manager()
    session = wizard_manager.get_current_session()

    if not session:
        return {"has_session": False, "message": "No active wizard session"}

    return {
        "has_session": True,
        "status": session.get_status_info(),
    }


@router.post("/api/wizard/rollback")
async def wizard_rollback(target_stage: str) -> dict[str, Any]:
    """Rollback wizard to a previous stage.

    Args:
        target_stage: Target stage ID to rollback to

    Returns:
        Result of rollback operation
    """
    wizard_manager = get_wizard_manager()
    session = wizard_manager.get_current_session()

    if not session:
        return {"success": False, "message": "No active wizard session"}

    try:
        session.transition_to_stage(target_stage, f"Rolled back to {target_stage}")

        # Notify via WebSocket if connected
        if session.websocket:
            await session.websocket.send_json(
                {
                    "type": "stage_changed",
                    "stage": target_stage,
                    "status": session.get_status_info(),
                }
            )

        return {
            "success": True,
            "stage": target_stage,
            "status": session.get_status_info(),
        }

    except Exception as e:
        debug_log(f"[WIZARD] Rollback error: {e}")
        return {"success": False, "message": str(e)}


def setup_wizard_routes(app: Any) -> None:
    """Setup wizard routes in FastAPI app.

    Args:
        app: FastAPI application instance
    """
    app.include_router(router)
    debug_log("[WIZARD] Wizard routes registered")
