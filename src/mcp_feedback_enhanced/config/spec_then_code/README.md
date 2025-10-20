# Spec-Then-Code Configuration

This directory stores YAML definitions for The Wizard's RIPER-5 workflows.

## File layout

- `spec_then_code.v1.yaml` – Canonical RIPER-5 workflow used for V1.

## YAML schema overview

Each workflow file must provide:

```yaml
metadata:
  name: string
  description: string
  version: integer
  start_step: string  # references a step id
  modes:              # optional – defaults to RIPER-5 modes
    - RESEARCH
    - INNOVATE
    - PLAN
    - EXECUTE
    - REVIEW

steps:
  - id: string            # unique step identifier
    mode: RESEARCH|...    # RIPER-5 stage
    type: ui_prompt | llm_task | terminal
    title: string         # human readable label (optional)
    instructions: string  # optional developer guidance
    # type-specific fields follow
```

### UI steps (`type: ui_prompt`)

```yaml
    component: string         # Streamlit component to render
    actions:
      - id: string            # unique per step
        label: string         # button label for the UI
        next_step_id: string  # destination step id
        capture_snapshot: bool | optional  # request history snapshot
        rewind_to_step: string | optional  # instruct engine to rewind state
```

### LLM steps (`type: llm_task`)

```yaml
    prompt_template: string   # Jinja2 template
    output_key: string        # key used to persist LLM output in session data
    on_success: string        # next step id on success
    on_failure: string | optional  # fallback step id on failure
```

### Terminal steps (`type: terminal`)

Terminal steps must not define actions; reaching the step signals the workflow
is complete.

Future workflows can extend the schema, but new fields should remain
backwards-compatible with the validation rules enforced in
`WorkflowEngine._load_and_validate`.
