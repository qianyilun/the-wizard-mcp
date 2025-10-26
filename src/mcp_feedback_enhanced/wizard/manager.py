#!/usr/bin/env python3
"""
Wizard UI Manager
=================

Manages wizard workflow sessions and coordinates between MCP tools,
WebSocket connections, and the Web UI.
"""

from __future__ import annotations

import asyncio
import threading
import time
from typing import Any

from ..debug import web_debug_log as debug_log
from .guide_engine import RoutineRegistry
from .session import WizardSession


class WizardUIManager:
    """Wizard UI Manager - manages wizard workflow sessions.

    This manager runs alongside WebUIManager and handles wizard-specific
    workflow sessions. It coordinates between:
    - MCP tool calls (from Cursor AI)
    - WebSocket connections (browser UI)
    - Workflow state machine (RoutineRegistry + WizardSession)
    """

    _instance: WizardUIManager | None = None
    _lock = threading.Lock()

    def __new__(cls) -> WizardUIManager:
        """Singleton pattern - ensure only one instance exists"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        # Only initialize once
        if hasattr(self, "_initialized"):
            return

        self._initialized = True

        # Session management
        self.current_session: WizardSession | None = None
        self.sessions: dict[str, WizardSession] = {}  # All sessions by ID

        # Workflow configuration
        self.routine_registry = RoutineRegistry()

        # Pending session update flag
        self._pending_session_update = False

        # Global active tabs (shared across sessions)
        self.global_active_tabs: dict[str, dict[str, Any]] = {}

        debug_log("[WIZARD] WizardUIManager initialized")

    def create_session(
        self,
        project_directory: str,
        routine_id: str = "RIPER-5",
        initial_request: str = "",
    ) -> str:
        """Create a new wizard session or update existing one.

        Args:
            project_directory: Project directory path
            routine_id: Workflow routine ID (default: RIPER-5)
            initial_request: User's initial request/task description

        Returns:
            Session ID
        """
        debug_log(f"[WIZARD] Creating session for routine: {routine_id}")

        # Handle existing session
        old_websocket = None
        if self.current_session:
            debug_log(
                f"[WIZARD] Existing session {self.current_session.session_id} "
                f"will be replaced"
            )

            # Save old WebSocket to transfer to new session
            old_websocket = self.current_session.websocket

            # Merge old session tabs to global
            self._merge_tabs_to_global(self.current_session.active_tabs)

            # Store old session in history
            self.sessions[self.current_session.session_id] = self.current_session

        # Create new session
        session = WizardSession(
            routine_id=routine_id,
            project_directory=project_directory,
            initial_request=initial_request,
        )

        # Set as current session
        self.current_session = session
        self.sessions[session.session_id] = session

        # Transfer WebSocket connection if exists
        if old_websocket:
            session.websocket = old_websocket
            debug_log("[WIZARD] Transferred WebSocket to new session")
        else:
            # Mark that we need to notify frontend when it connects
            self._pending_session_update = True

        # Inherit global active tabs
        for tab_id, tab_info in self.global_active_tabs.items():
            session.active_tabs[tab_id] = tab_info.get("last_heartbeat", 0)

        debug_log(
            f"[WIZARD] Created session {session.session_id} (routine: {routine_id})"
        )

        return session.session_id

    def get_current_session(self) -> WizardSession | None:
        """Get the current active wizard session.

        Returns:
            Current WizardSession or None
        """
        return self.current_session

    def get_session(self, session_id: str) -> WizardSession | None:
        """Get a specific wizard session by ID.

        Args:
            session_id: Session ID to retrieve

        Returns:
            WizardSession or None if not found
        """
        return self.sessions.get(session_id)

    def remove_session(self, session_id: str) -> bool:
        """Remove and cleanup a wizard session.

        Args:
            session_id: Session ID to remove

        Returns:
            True if session was removed
        """
        session = self.sessions.get(session_id)
        if not session:
            return False

        debug_log(f"[WIZARD] Removing session {session_id}")

        # Close WebSocket if exists
        if session.websocket:
            try:
                asyncio.create_task(session.websocket.close())
            except Exception as e:
                debug_log(f"[WIZARD] Error closing WebSocket: {e}")

        # Remove from tracking
        self.sessions.pop(session_id, None)
        if self.current_session and self.current_session.session_id == session_id:
            self.current_session = None

        return True

    def clear_current_session(self) -> None:
        """Clear the current active session"""
        if self.current_session:
            self.remove_session(self.current_session.session_id)
        self.current_session = None
        debug_log("[WIZARD] Cleared current session")

    def _merge_tabs_to_global(self, session_tabs: dict[str, float]) -> None:
        """Merge session tabs to global tracking.

        Args:
            session_tabs: Dictionary of tab_id -> last_heartbeat
        """
        now = time.time()
        cutoff = now - 60  # Remove tabs inactive for 60+ seconds

        for tab_id, last_heartbeat in session_tabs.items():
            if last_heartbeat > cutoff:
                self.global_active_tabs[tab_id] = {
                    "last_heartbeat": last_heartbeat,
                    "merged_at": now,
                }

    def get_global_active_tabs_count(self) -> int:
        """Get count of globally active tabs.

        Returns:
            Number of active tabs
        """
        now = time.time()
        cutoff = now - 60

        # Clean up stale tabs
        stale_tabs = [
            tab_id
            for tab_id, info in self.global_active_tabs.items()
            if info.get("last_heartbeat", 0) < cutoff
        ]
        for tab_id in stale_tabs:
            self.global_active_tabs.pop(tab_id, None)

        return len(self.global_active_tabs)

    async def handle_wizard_message(
        self, message: dict[str, Any], session: WizardSession
    ) -> dict[str, Any] | None:
        """Handle incoming WebSocket message for wizard session.

        Args:
            message: Parsed WebSocket message
            session: WizardSession instance

        Returns:
            Response message or None
        """
        msg_type = message.get("type")
        debug_log(f"[WIZARD] Handling message type: {msg_type}")

        if msg_type == "heartbeat":
            return await self._handle_heartbeat(message, session)

        if msg_type == "mode_selected":
            return await self._handle_mode_selected(message, session)

        if msg_type == "confirm_blueprint":
            return await self._handle_confirm_blueprint(message, session)

        if msg_type == "request_ai_update":
            return await self._handle_request_ai_update(message, session)

        if msg_type == "approve_tests":
            return await self._handle_approve_tests(message, session)

        if msg_type == "accept_code":
            return await self._handle_accept_code(message, session)

        if msg_type == "rollback_to_stage":
            return await self._handle_rollback(message, session)

        debug_log(f"[WIZARD] Unknown message type: {msg_type}")
        return {"type": "error", "message": f"Unknown message type: {msg_type}"}

    async def _handle_heartbeat(
        self, message: dict[str, Any], session: WizardSession
    ) -> dict[str, Any]:
        """Handle heartbeat message"""
        tab_id = message.get("tab_id")
        session.update_heartbeat(tab_id)
        return {"type": "heartbeat_ack", "timestamp": session.last_heartbeat}

    async def _handle_mode_selected(
        self, message: dict[str, Any], session: WizardSession
    ) -> dict[str, Any]:
        """Handle mode selection message"""
        mode = message.get("mode")
        debug_log(f"[WIZARD] Mode selected: {mode}")

        if mode == "spec_first":
            # Transition to plan stage
            session.transition_to_stage("REVIEW_BLUEPRINT", "Entering blueprint design")
            return {
                "type": "stage_changed",
                "stage": "REVIEW_BLUEPRINT",
                "status": session.get_status_info(),
            }
        return {
            "type": "error",
            "message": f"Mode {mode} not supported in V1",
        }

    async def _handle_confirm_blueprint(
        self, message: dict[str, Any], session: WizardSession
    ) -> dict[str, Any]:
        """Handle blueprint confirmation"""
        blueprint_text = message.get("blueprint", "")

        # Save as user-edited version
        session.save_blueprint_version(blueprint_text, author="user")
        session.confirm_blueprint()

        # Transition to next stage
        session.transition_to_stage("REVIEW_TEST_MATRIX", "Blueprint confirmed")

        return {
            "type": "blueprint_confirmed",
            "next_stage": "REVIEW_TEST_MATRIX",
            "status": session.get_status_info(),
        }

    async def _handle_request_ai_update(
        self, message: dict[str, Any], session: WizardSession
    ) -> dict[str, Any]:
        """Handle request for AI to update blueprint"""
        feedback = message.get("feedback", "")

        # In real implementation, this would communicate back to Cursor AI
        # For now, return a placeholder
        return {
            "type": "ai_update_requested",
            "message": "Request sent to AI. Please regenerate from Cursor.",
            "feedback": feedback,
        }

    async def _handle_approve_tests(
        self, message: dict[str, Any], session: WizardSession
    ) -> dict[str, Any]:
        """Handle test approval"""
        test_ids = message.get("test_ids")
        session.approve_tests(test_ids)

        # Transition to code generation stage
        session.transition_to_stage("GENERATE_IMPLEMENTATION", "Tests approved")

        return {
            "type": "tests_approved",
            "next_stage": "GENERATE_IMPLEMENTATION",
            "status": session.get_status_info(),
        }

    async def _handle_accept_code(
        self, message: dict[str, Any], session: WizardSession
    ) -> dict[str, Any]:
        """Handle code acceptance"""
        session.accept_code()

        return {
            "type": "code_accepted",
            "status": session.get_status_info(),
            "message": "Workflow completed successfully!",
        }

    async def _handle_rollback(
        self, message: dict[str, Any], session: WizardSession
    ) -> dict[str, Any]:
        """Handle rollback to previous stage"""
        target_stage = message.get("target_stage")

        if not target_stage:
            return {"type": "error", "message": "No target stage specified"}

        # Simple rollback - just change the stage
        # In full implementation, would clear downstream artifacts
        session.transition_to_stage(target_stage, f"Rolled back to {target_stage}")

        return {
            "type": "stage_changed",
            "stage": target_stage,
            "status": session.get_status_info(),
        }

    def get_wizard_url(self, base_url: str) -> str:
        """Get the wizard UI URL.

        Args:
            base_url: Base server URL (e.g., http://localhost:8765)

        Returns:
            Full wizard URL
        """
        return f"{base_url}/wizard"


# Global singleton instance accessor
_wizard_manager_instance: WizardUIManager | None = None


def get_wizard_manager() -> WizardUIManager:
    """Get the global WizardUIManager instance.

    Returns:
        WizardUIManager singleton instance
    """
    global _wizard_manager_instance
    if _wizard_manager_instance is None:
        _wizard_manager_instance = WizardUIManager()
    return _wizard_manager_instance
