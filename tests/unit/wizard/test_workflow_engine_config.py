"""Tests for the Spec-Then-Code workflow configuration loader."""

from __future__ import annotations

from pathlib import Path

import pytest

from mcp_feedback_enhanced.wizard.guide_engine import (
    ConfigError,
    StepDefinition,
    WorkflowEngine,
)


def test_default_config_loads() -> None:
    engine = WorkflowEngine()

    assert engine.metadata["name"] == "Spec-Then-Code Workflow"
    assert engine.metadata["start_step"] == "COLLECT_CONTEXT"
    assert set(engine.steps.keys()) >= {
        "COLLECT_CONTEXT",
        "INSIGHT_CLASSIFICATION",
        "GENERATE_BLUEPRINT",
        "WORKFLOW_COMPLETE",
    }
    assert all(isinstance(step, StepDefinition) for step in engine.steps.values())


def test_missing_file_raises_config_error(tmp_path: Path) -> None:
    missing_file = tmp_path / "unknown.yaml"
    with pytest.raises(ConfigError, match="Workflow config not found"):
        WorkflowEngine(missing_file)


def test_invalid_reference_raises_error(tmp_path: Path) -> None:
    config = tmp_path / "broken.yaml"
    config.write_text(
        """
metadata:
  name: Broken
  description: test
  version: 1
  start_step: STEP_A
steps:
  - id: STEP_A
    mode: RESEARCH
    type: ui_prompt
    component: stub
    actions:
      - id: go
        label: go
        next_step_id: MISSING
        capture_snapshot: false
""",
        encoding="utf-8",
    )

    with pytest.raises(ConfigError, match="unknown steps"):
        WorkflowEngine(config)


def test_duplicate_step_id_raises_error(tmp_path: Path) -> None:
    config = tmp_path / "duplicate.yaml"
    config.write_text(
        """
metadata:
  name: Broken
  description: test
  version: 1
  start_step: STEP_A
steps:
  - id: STEP_A
    mode: RESEARCH
    type: ui_prompt
    component: stub
    actions:
      - id: go
        label: go
        next_step_id: STEP_B
  - id: STEP_A
    mode: PLAN
    type: terminal
""",
        encoding="utf-8",
    )

    with pytest.raises(ConfigError, match="Duplicate step id"):
        WorkflowEngine(config)
