#!/usr/bin/env python3
"""
Wizard Session Management
=========================

Manages individual wizard workflow sessions with state tracking,
blueprint versioning, and stage progression.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

from fastapi import WebSocket


class WizardSessionStatus(Enum):
    """Wizard session status enum - workflow progression states"""

    INITIALIZING = "initializing"  # Session being created
    MODE_SELECTION = "mode_selection"  # Waiting for mode selection
    PLANNING = "planning"  # In Plan stage (blueprint editing)
    TESTING = "testing"  # In Execute Tests stage
    CODING = "coding"  # In Execute Code stage
    REVIEWING = "reviewing"  # In Refine stage
    COMPLETED = "completed"  # Workflow completed successfully
    ERROR = "error"  # Error state
    CANCELLED = "cancelled"  # User cancelled


@dataclass
class BlueprintVersion:
    """Represents a version of the blueprint diagram"""

    version: int
    text: str
    timestamp: datetime
    author: str  # "ai" or "user"
    stage_id: str  # Which workflow stage this was created in


@dataclass
class TestCase:
    """Represents a test case in the test matrix"""

    id: str
    description: str
    inputs: str
    expected: str
    approved: bool = False


class WizardSession:
    """Wizard workflow session management.

    This class manages the state and data for a single wizard workflow session,
    tracking the current stage, blueprint versions, test cases, and generated code.
    """

    def __init__(
        self,
        session_id: str | None = None,
        routine_id: str = "RIPER-5",
        project_directory: str = ".",
        initial_request: str = "",
    ):
        # Basic session information
        self.session_id = session_id or str(uuid.uuid4())
        self.routine_id = routine_id
        self.project_directory = project_directory
        self.initial_request = initial_request

        # WebSocket connection
        self.websocket: WebSocket | None = None

        # Workflow state
        self.current_stage: str = "COLLECT_CONTEXT"  # Current workflow stage ID
        self.status = WizardSessionStatus.INITIALIZING
        self.status_message = "Initializing wizard session"

        # Stage completion tracking
        self.stage_completed: dict[str, bool] = {}
        self.completed_stages: list[str] = []  # Ordered list of completed stages

        # Blueprint data
        self.blueprint_text: str | None = None  # Current blueprint
        self.blueprint_versions: list[BlueprintVersion] = []
        self.blueprint_confirmed: bool = False

        # Test cases
        self.test_cases: list[TestCase] = []
        self.tests_approved: bool = False

        # Generated code
        self.generated_code: str | None = None
        self.code_accepted: bool = False

        # Session metadata
        self.created_at = time.time()
        self.last_activity = self.created_at
        self.last_heartbeat: float | None = None

        # Active browser tabs tracking
        self.active_tabs: dict[str, float] = {}

    def transition_to_stage(self, new_stage: str, message: str | None = None) -> bool:
        """Transition to a new workflow stage.

        Args:
            new_stage: Target stage ID
            message: Optional status message

        Returns:
            True if transition successful, False otherwise
        """
        # Mark previous stage as completed if transitioning forward
        if self.current_stage and self.current_stage not in self.completed_stages:
            self.stage_completed[self.current_stage] = True
            self.completed_stages.append(self.current_stage)

        # Update stage
        old_stage = self.current_stage
        self.current_stage = new_stage
        self.status_message = message or f"Entered {new_stage} stage"
        self.last_activity = time.time()

        # Update status based on stage
        self._update_status_from_stage(new_stage)

        print(
            f"[WIZARD] Session {self.session_id} transitioned: "
            f"{old_stage} → {new_stage}"
        )
        return True

    def _update_status_from_stage(self, stage: str) -> None:
        """Update session status based on current stage"""
        stage_status_map = {
            "COLLECT_CONTEXT": WizardSessionStatus.INITIALIZING,
            "INSIGHT_CLASSIFICATION": WizardSessionStatus.MODE_SELECTION,
            "GENERATE_BLUEPRINT": WizardSessionStatus.PLANNING,
            "REVIEW_BLUEPRINT": WizardSessionStatus.PLANNING,
            "GENERATE_TEST_MATRIX": WizardSessionStatus.TESTING,
            "REVIEW_TEST_MATRIX": WizardSessionStatus.TESTING,
            "GENERATE_IMPLEMENTATION": WizardSessionStatus.CODING,
            "GENERATE_TRACE": WizardSessionStatus.REVIEWING,
            "REVIEW_TRACE": WizardSessionStatus.REVIEWING,
            "WORKFLOW_COMPLETE": WizardSessionStatus.COMPLETED,
        }
        self.status = stage_status_map.get(stage, self.status)

    def save_blueprint_version(
        self, text: str, author: str = "ai", stage_id: str | None = None
    ) -> int:
        """Save a new version of the blueprint.

        Args:
            text: Blueprint Mermaid source code
            author: Who created this version ("ai" or "user")
            stage_id: Which stage this was created in

        Returns:
            Version number of the saved blueprint
        """
        version_num = len(self.blueprint_versions) + 1
        version = BlueprintVersion(
            version=version_num,
            text=text,
            timestamp=datetime.now(),
            author=author,
            stage_id=stage_id or self.current_stage,
        )
        self.blueprint_versions.append(version)
        self.blueprint_text = text
        self.last_activity = time.time()

        print(
            f"[WIZARD] Saved blueprint version {version_num} "
            f"(author: {author}, stage: {stage_id})"
        )
        return version_num

    def confirm_blueprint(self) -> bool:
        """Mark the current blueprint as confirmed by user.

        Returns:
            True if confirmation successful
        """
        if not self.blueprint_text:
            return False

        self.blueprint_confirmed = True
        self.last_activity = time.time()

        print(f"[WIZARD] Blueprint confirmed for session {self.session_id}")
        return True

    def save_test_cases(self, tests: list[dict[str, Any]]) -> None:
        """Save test cases from AI generation.

        Args:
            tests: List of test case dictionaries
        """
        self.test_cases = [
            TestCase(
                id=test.get("id", str(uuid.uuid4())),
                description=test.get("description", ""),
                inputs=test.get("inputs", ""),
                expected=test.get("expected", ""),
                approved=False,
            )
            for test in tests
        ]
        self.last_activity = time.time()

        print(f"[WIZARD] Saved {len(self.test_cases)} test cases")

    def approve_tests(self, test_ids: list[str] | None = None) -> bool:
        """Approve test cases for code generation.

        Args:
            test_ids: Optional list of test IDs to approve (if None, approve all)

        Returns:
            True if approval successful
        """
        if test_ids is None:
            # Approve all tests
            for test in self.test_cases:
                test.approved = True
        else:
            # Approve specific tests
            for test in self.test_cases:
                if test.id in test_ids:
                    test.approved = True

        self.tests_approved = all(test.approved for test in self.test_cases)
        self.last_activity = time.time()

        print(f"[WIZARD] Tests approved: {self.tests_approved}")
        return self.tests_approved

    def save_generated_code(self, code: str) -> None:
        """Save AI-generated implementation code.

        Args:
            code: Generated code (patch format or full files)
        """
        self.generated_code = code
        self.last_activity = time.time()

        print(f"[WIZARD] Saved generated code ({len(code)} chars)")

    def accept_code(self) -> bool:
        """Mark the generated code as accepted by user.

        Returns:
            True if acceptance successful
        """
        if not self.generated_code:
            return False

        self.code_accepted = True
        self.status = WizardSessionStatus.COMPLETED
        self.status_message = "Workflow completed successfully"
        self.last_activity = time.time()

        print(f"[WIZARD] Code accepted, session {self.session_id} completed")
        return True

    def update_heartbeat(self, tab_id: str | None = None) -> None:
        """Update session heartbeat.

        Args:
            tab_id: Optional browser tab identifier
        """
        now = time.time()
        self.last_heartbeat = now
        self.last_activity = now

        if tab_id:
            self.active_tabs[tab_id] = now

    def get_status_info(self) -> dict[str, Any]:
        """Get comprehensive session status information.

        Returns:
            Dictionary with session status details
        """
        return {
            "session_id": self.session_id,
            "routine_id": self.routine_id,
            "status": self.status.value,
            "status_message": self.status_message,
            "current_stage": self.current_stage,
            "completed_stages": self.completed_stages,
            "stage_completed": self.stage_completed,
            "blueprint_confirmed": self.blueprint_confirmed,
            "blueprint_version_count": len(self.blueprint_versions),
            "tests_approved": self.tests_approved,
            "test_count": len(self.test_cases),
            "code_accepted": self.code_accepted,
            "has_websocket": self.websocket is not None,
            "created_at": self.created_at,
            "last_activity": self.last_activity,
            "project_directory": self.project_directory,
        }

    def is_active(self) -> bool:
        """Check if session is still active.

        Returns:
            True if session has recent activity
        """
        if self.status in [
            WizardSessionStatus.COMPLETED,
            WizardSessionStatus.ERROR,
            WizardSessionStatus.CANCELLED,
        ]:
            return False

        # Check if any recent activity (within last 30 minutes)
        max_idle = 1800  # 30 minutes
        return (time.time() - self.last_activity) < max_idle
