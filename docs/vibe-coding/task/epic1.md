### JIRA Breakdown: Epics, Tasks, and Sub-tasks

Here is a comprehensive breakdown of the work, structured for a JIRA project. I've used story points (SP) to estimate complexity.

---

### **EPIC-1: Core Engine & Foundation**

*Description: Build the foundational, non-UI components of The Wizard inside the existing `mcp-feedback-enhanced` fork. This covers package scaffolding, the RIPER-5-driven workflow engine, and baseline diagnostics.*

**TASK-1 (User Story):** As an SDE, I need the repo scaffolded for Wizard development so core modules load cleanly and reuse the existing uv toolchain. (3 SP)

* **Sub-task 1.1:** Extend `pyproject.toml` to include Streamlit, PyYAML, Jinja2, and any test extras; run `uv sync --dev` to lock dependencies.
* **Sub-task 1.2:** Create the `src/mcp_feedback_enhanced/wizard/` package with module shells (`wizard_app.py`, `guide_engine.py`, `ui_components.py`, `__init__.py`) plus `src/mcp_feedback_enhanced/config/spec_then_code/` for YAML assets.
* **Sub-task 1.3:** Update imports/`__all__` as needed so Ruff/isort succeed and `make check`, `make test` still pass.
* **Sub-task 1.4:** Refresh README sections (or add a new one) linking to `AGENTS.md` and briefly describing the Wizard development setup.
* **Acceptance:** `uv sync --dev` succeeds; `make check` and `make test` pass; running `python -m mcp_feedback_enhanced.wizard.wizard_app` imports without errors.

**TASK-2 (User Story):** As an SDE, I need a validated Spec-Then-Code YAML config so the engine can load the RIPER-5 workflow without hardcoding logic. (8 SP)

* **Sub-task 2.1:** Author `spec_then_code.v1.yaml` covering RIPER-5 stages (Research, Innovate, Plan, Execute, Review) with step metadata, approvals, backward transitions, and output bindings.
* **Sub-task 2.2:** Implement YAML loading/validation in `WorkflowEngine.__init__`, enforcing unique IDs, valid `next_step_id` references, and required fields per step type.
* **Sub-task 2.3:** Define `ConfigError`, `StateError`, and `LLMError` with actionable messages; surface validation failures through these exceptions.
* **Sub-task 2.4:** Document the schema (inline comments + developer note) so future workflows can extend it safely.
* **Acceptance:** Unit tests confirm valid configs load to structured data, malformed configs raise the correct exception, and the engine exposes parsed step metadata.

**TASK-3 (User Story):** As an SDE, I need the `WorkflowEngine` to manage session state, history, and RIPER-5 transitions so the UI can enforce approvals and rewinds. (8 SP)

* **Sub-task 3.1:** Implement `_current_step_id`, `_session_data`, and a history snapshot list; take deep copies whenever a step is confirmed.
* **Sub-task 3.2:** Implement `get_current_step_info()` returning serializable metadata (step type, component, allowed actions) for the UI loop.
* **Sub-task 3.3:** Implement `handle_action(action_id, payload)` to validate actions, mutate session data, push history, and respect backward transitions defined in the YAML.
* **Sub-task 3.4:** Provide helpers to restore prior snapshots when transitioning back to earlier modes (the RIPER-5 “return to PLAN/RESEARCH” behavior).
* **Acceptance:** Unit tests cover happy-path transitions, invalid actions raising `StateError`, history snapshots being restored, and backward moves resetting session data appropriately.

**TASK-4 (User Story):** As an SDE, I want lightweight runtime diagnostics so I can trace RIPER-5 mode changes during development. (5 SP)

* **Sub-task 4.1:** Integrate Python logging (and simple `print` statements) inside key engine methods to emit mode transitions and mocked LLM invocations.
* **Sub-task 4.2:** Include session identifiers/timestamps in log messages to support manual tracing.
* **Sub-task 4.3:** Add tests (or log capture hooks) confirming diagnostics fire without breaking Streamlit execution.
* **Acceptance:** Sample runs print/log clear transition traces from Research through Review; tests confirm logging path executes without raising runtime errors.
