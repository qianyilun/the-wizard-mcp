"""Workflow engine configuration and validation for The Wizard.

This module loads the Spec-Then-Code workflow definition from YAML and performs
schema validation so subsequent tasks can focus on the state machine
implementation. Runtime behaviour (session state, transitions) will be
introduced in later tasks.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


class ConfigError(RuntimeError):
    """Raised when the workflow configuration file is invalid."""


class StateError(RuntimeError):
    """Raised when an action is incompatible with the current workflow state."""


class LLMError(RuntimeError):
    """Raised when an LLM task fails to produce a usable result."""


@dataclass(frozen=True)
class StepDefinition:
    """Structured representation of a workflow step definition."""

    id: str
    mode: str
    type: str
    raw: Mapping[str, Any]


class WorkflowEngine:
    """Configuration-aware workflow engine for The Wizard.

    Parameters
    ----------
    config_path:
        Optional path to a workflow YAML file. When omitted the default
        Spec-Then-Code V1 configuration bundled with the package is used.
    """

    DEFAULT_CONFIG_PATH = (
        Path(__file__).resolve().parent.parent
        / "config"
        / "spec_then_code"
        / "spec_then_code.v1.yaml"
    )

    _STEP_TYPES = {"ui_prompt", "llm_task", "terminal"}
    _RIPER_MODES = {"RESEARCH", "INNOVATE", "PLAN", "EXECUTE", "REVIEW"}

    def __init__(self, config_path: str | Path | None = None) -> None:
        self._config_path = (
            Path(config_path) if config_path else self.DEFAULT_CONFIG_PATH
        )
        self._config = self._load_and_validate(self._config_path)
        self.metadata: Mapping[str, Any] = self._config["metadata"]
        self._steps: dict[str, StepDefinition] = {
            entry["id"]: StepDefinition(
                id=entry["id"],
                mode=entry["mode"],
                type=entry["type"],
                raw=entry,
            )
            for entry in self._config["steps"]
        }
        self._current_step_id: str = self.metadata["start_step"]
        self._session_data: dict[str, Any] = {}

    # ------------------------------------------------------------------
    # Configuration helpers

    @property
    def steps(self) -> Mapping[str, StepDefinition]:
        """Return the indexed step definitions."""

        return self._steps

    def get_step(self, step_id: str) -> StepDefinition:
        """Return a step definition by identifier."""

        try:
            return self._steps[step_id]
        except KeyError as exc:  # pragma: no cover - defensive guard
            raise StateError(f"Unknown step '{step_id}'") from exc

    def _load_and_validate(self, path: Path) -> dict[str, Any]:
        if not path.exists():
            raise ConfigError(f"Workflow config not found at {path}")

        try:
            with path.open("r", encoding="utf-8") as handle:
                raw = yaml.safe_load(handle)
        except yaml.YAMLError as exc:
            raise ConfigError(f"Failed to parse YAML config: {exc}") from exc

        if not isinstance(raw, dict):
            raise ConfigError("Workflow config must be a mapping")

        metadata = raw.get("metadata")
        if not isinstance(metadata, dict):
            raise ConfigError("Workflow metadata must be defined")

        required_meta = {"name", "description", "version", "start_step"}
        missing_meta = required_meta.difference(metadata)
        if missing_meta:
            raise ConfigError(
                f"Metadata missing required fields: {sorted(missing_meta)}"
            )

        start_step = metadata["start_step"]
        if not isinstance(start_step, str) or not start_step:
            raise ConfigError("metadata.start_step must be a non-empty string")

        modes = metadata.get("modes")
        if modes is None:
            metadata["modes"] = sorted(self._RIPER_MODES)
        elif not isinstance(modes, list) or not all(
            isinstance(item, str) for item in modes
        ):
            raise ConfigError("metadata.modes must be a list of strings")

        steps = raw.get("steps")
        if not isinstance(steps, list) or not steps:
            raise ConfigError("Workflow must define a non-empty 'steps' list")

        step_ids: set[str] = set()
        referenced_steps: set[str] = set()

        for entry in steps:
            self._validate_step(entry, step_ids, referenced_steps)

        if start_step not in step_ids:
            raise ConfigError(
                f"metadata.start_step '{start_step}' does not match any step id"
            )

        unknown_refs = referenced_steps.difference(step_ids | {"__END__"})
        if unknown_refs:
            raise ConfigError(
                f"Workflow references unknown steps: {sorted(unknown_refs)}"
            )

        terminal_steps = [item for item in steps if item["type"] == "terminal"]
        if not terminal_steps:
            raise ConfigError("Workflow must contain at least one terminal step")

        return {"metadata": metadata, "steps": steps}

    def _validate_step(
        self,
        entry: Any,
        step_ids: set[str],
        referenced_steps: set[str],
    ) -> None:
        if not isinstance(entry, dict):
            raise ConfigError("Each step must be a mapping")

        step_id = entry.get("id")
        if not isinstance(step_id, str) or not step_id:
            raise ConfigError("Step id must be a non-empty string")
        if step_id in step_ids:
            raise ConfigError(f"Duplicate step id detected: {step_id}")
        step_ids.add(step_id)

        mode = entry.get("mode")
        if mode not in self._RIPER_MODES:
            raise ConfigError(f"Step '{step_id}' has invalid mode '{mode}'")

        step_type = entry.get("type")
        if step_type not in self._STEP_TYPES:
            raise ConfigError(f"Step '{step_id}' has invalid type '{step_type}'")

        if step_type == "ui_prompt":
            self._validate_ui_step(step_id, entry, referenced_steps)
        elif step_type == "llm_task":
            self._validate_llm_step(step_id, entry, referenced_steps)
        elif entry.get("actions"):
            raise ConfigError(f"Terminal step '{step_id}' cannot define actions")

    def _validate_ui_step(
        self, step_id: str, entry: Mapping[str, Any], referenced_steps: set[str]
    ) -> None:
        component = entry.get("component")
        if not isinstance(component, str) or not component:
            raise ConfigError(
                f"UI step '{step_id}' must define a non-empty component name"
            )

        actions = entry.get("actions")
        if not isinstance(actions, list) or not actions:
            raise ConfigError(
                f"UI step '{step_id}' must define a non-empty actions list"
            )

        for action in actions:
            if not isinstance(action, dict):
                raise ConfigError(f"Step '{step_id}' actions must be mappings")
            action_id = action.get("id")
            if not isinstance(action_id, str) or not action_id:
                raise ConfigError(f"Step '{step_id}' action missing non-empty id")
            next_step = action.get("next_step_id")
            if not isinstance(next_step, str) or not next_step:
                raise ConfigError(
                    f"Action '{action_id}' in step '{step_id}' missing next_step_id"
                )
            referenced_steps.add(next_step)

    def _validate_llm_step(
        self, step_id: str, entry: Mapping[str, Any], referenced_steps: set[str]
    ) -> None:
        prompt = entry.get("prompt_template")
        output_key = entry.get("output_key")
        if not isinstance(prompt, str) or not prompt.strip():
            raise ConfigError(f"LLM step '{step_id}' must define prompt_template")
        if not isinstance(output_key, str) or not output_key:
            raise ConfigError(f"LLM step '{step_id}' must define output_key")

        on_success = entry.get("on_success")
        if not isinstance(on_success, str) or not on_success:
            raise ConfigError(f"LLM step '{step_id}' must define on_success")
        referenced_steps.add(on_success)

        on_failure = entry.get("on_failure")
        if on_failure is not None:
            if not isinstance(on_failure, str) or not on_failure:
                raise ConfigError(f"LLM step '{step_id}' has invalid on_failure value")
            referenced_steps.add(on_failure)

    # ------------------------------------------------------------------
    # Placeholder behaviour to be replaced in Task 3

    def get_current_step_info(self) -> Mapping[str, Any]:
        """Return the raw configuration for the current step."""

        return self.get_step(self._current_step_id).raw

    def handle_action(
        self, action_id: str, payload: Mapping[str, Any] | None = None
    ) -> None:
        """Placeholder action handler retained for API stability."""

        _ = (action_id, payload)
