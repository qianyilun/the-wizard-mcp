# The Wizard V1 - Comprehensive Implementation Plan

## Executive Summary

Transform the existing mcp-feedback-enhanced foundation into **The Wizard V1**, implementing the RIPER-5 workflow (Read → Insight → Plan → Execute → Refine) with Diagram-as-a-Spec (DAAS) methodology. This is an **MLP (Minimal Lovable Product)**, not a POC - requiring clean architecture, real AI integration, and production-quality code.

**Success Criteria:** Users can navigate Plan → Execute → Accept Code with real AI interaction, using Mermaid diagrams as binding specifications.

---

## Architecture Decisions

### 1. Session Management: Create WizardSession Class

**Decision:** Build new `WizardSession` class separate from `WebFeedbackSession`

**Rationale:**

- Multi-stage workflow fundamentally different from single feedback loop
- Clean separation of concerns for MLP quality
- Dedicated fields: `phase`, `blueprint_text`, `blueprint_versions`, `test_cases`, `generated_code`
- Reuse patterns from WebFeedbackSession (WebSocket handling, cleanup) but purpose-built

**Location:** `src/mcp_feedback_enhanced/wizard/session.py`

### 2. Workflow Engine: State Machine with Stage Definitions

**Decision:** Implement explicit state machine with configurable stage definitions

**Components:**

- `WorkflowEngine` - orchestrates stage transitions
- `RoutineRegistry` - loads workflow definitions (RIPER-5 initially)
- `StageHandler` base class - each stage inherits and implements specific behavior

**Location:** `src/mcp_feedback_enhanced/wizard/engine.py`

### 3. Frontend Technology Stack

**Mermaid Editor (Phase 1):**

- mermaid.js v10+ (CDN: https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js)
- Simple textarea for source editing
- Dual-pane layout with live preview

**Upgrade Path (Phase 5):**

- Replace textarea with CodeMirror 6 for syntax highlighting
- Add error highlighting, line numbers

### 4. Prompt Templates

**Storage:** `src/mcp_feedback_enhanced/wizard/prompts/`

- `plan_stage.txt` - instructs AI to generate Mermaid diagrams
- `execute_tests.txt` - generates test cases from blueprint
- `execute_code.txt` - generates code from blueprint + tests
- `refine_stage.txt` - review and acceptance prompts

---

## Implementation Phases

### Phase 1: Foundation + Plan Stage (Weeks 1-2)

**Goal:** Core infrastructure + functional Plan stage with Mermaid editing

#### Backend Tasks

**1.1 Create WizardSession Class**

- File: `src/mcp_feedback_enhanced/wizard/session.py`
- Fields:
  ```python
  class WizardSession:
      session_id: str
      routine_id: str  # "RIPER-5"
      current_stage: str  # "read", "insight", "plan", "execute_tests", "execute_code", "refine"
      project_directory: str
      websocket: Optional[WebSocket]

      # Stage-specific data
      blueprint_text: Optional[str]
      blueprint_versions: List[Dict]  # [{version: 1, text: "...", timestamp: "...", author: "ai/user"}]
      test_cases: List[Dict]  # [{id: 1, description: "...", approved: bool}]
      generated_code: Optional[str]

      # Status
      status: SessionStatus  # extend enum with PLANNING, TESTING, CODING, REVIEWING
      stage_completed: Dict[str, bool]  # {"plan": True, "execute_tests": False, ...}

      # Existing patterns from WebFeedbackSession
      created_at: datetime
      last_heartbeat: datetime
      active_tabs: Dict[str, float]
  ```

- Methods: `transition_to_stage()`, `save_blueprint_version()`, `confirm_blueprint()`, `approve_tests()`, `accept_code()`

**1.2 Create Workflow Engine**

- File: `src/mcp_feedback_enhanced/wizard/engine.py`
- Classes:
  ```python
  class WorkflowEngine:
      def __init__(self, manager: WizardUIManager):
          self.manager = manager
          self.routine_registry = RoutineRegistry()

      def start_routine(self, routine_id: str, context: Dict) -> WizardSession:
          """Create session and begin workflow"""

      def process_stage(self, session: WizardSession, stage: str) -> StageResult:
          """Execute AI prompt for given stage"""

      def transition_stage(self, session: WizardSession, to_stage: str, user_data: Dict):
          """Handle user confirmation and move to next stage"""

      def rollback_stage(self, session: WizardSession, to_stage: str):
          """Go back to previous stage (e.g., Refine → Plan)"""
  ```


**1.3 Create Routine Registry**

- File: `src/mcp_feedback_enhanced/wizard/registry.py`
- Load RIPER-5 definition from JSON/YAML or hardcoded initially
- Structure:
  ```json
  {
    "id": "RIPER-5",
    "name": "Spec-Then-Code",
    "stages": [
      {
        "id": "plan",
        "name": "Plan (Blueprint Design)",
        "prompt_template": "prompts/plan_stage.txt",
        "ui_type": "mermaid_editor",
        "requires_confirmation": true,
        "next_stage": "execute_tests"
      },
      ...
    ]
  }
  ```


**1.4 Create WizardUIManager**

- File: `src/mcp_feedback_enhanced/wizard/manager.py`
- Extends or parallels existing WebUIManager
- Manages WizardSessions instead of WebFeedbackSession
- Methods: `create_wizard_session()`, `get_current_wizard_session()`, `handle_wizard_message()`

**1.5 Add Wizard MCP Tool**

- File: `src/mcp_feedback_enhanced/server.py`
- New tool function:
  ```python
  @mcp.tool()
  async def start_wizard(
      routine: str = "RIPER-5",
      project_dir: str = ".",
      initial_prompt: str = ""
  ) -> list[TextContent | ImageContent]:
      """
      Start The Wizard guided workflow for spec-first development.

      Args:
          routine: Workflow routine ID (default: RIPER-5)
          project_dir: Project directory path
          initial_prompt: User's initial requirements/task description

      Returns:
          Result of workflow stage or error message
      """
      # Initialize WizardUIManager
      # Create WizardSession
      # Start at Read/Insight or jump to Plan
      # Return UI URL and initial AI response
  ```


**1.6 Create Prompt Templates**

- File: `src/mcp_feedback_enhanced/wizard/prompts/plan_stage.txt`
- Template with placeholders: `{user_requirements}`, `{project_context}`
- Instructions for AI to output Mermaid diagrams
- Example template structure:
  ```
  You are an expert software architect. Based on the following requirements, create a solution design blueprint.

  Requirements:
  {user_requirements}

  Project Context:
  {project_context}

  Output a Mermaid diagram showing:
 1. Sequence diagram or flowchart of the main process flow
 2. Class/module diagram showing key components

  Use proper Mermaid syntax. Only output the diagram code, prefaced with diagram type.
  ```


#### Frontend Tasks

**1.7 Create Wizard UI Entry Point**

- File: `src/mcp_feedback_enhanced/web/templates/wizard.html`
- Base template for wizard interface
- Stage indicator/progress bar at top
- Main content area that changes per stage
- WebSocket connection to wizard endpoint

**1.8 Create Mode Selection UI**

- File: `src/mcp_feedback_enhanced/web/static/js/wizard/mode-selector.js`
- 4-quadrant layout (similar to PRD's 四象限)
- Quadrants: Quick Script, Exploratory, Test-First, Spec-First
- Only Spec-First is clickable/functional
- On selection, sends `{"type": "mode_selected", "mode": "spec_first"}`

**1.9 Create Plan Stage UI (Mermaid Editor)**

- File: `src/mcp_feedback_enhanced/web/static/js/wizard/plan-editor.js`
- Dual-pane layout:
                                                                - Left: `<textarea id="mermaid-source">` for editing Mermaid code
                                                                - Right: `<div id="mermaid-preview">` for rendered diagram
- Load mermaid.js from CDN
- Real-time rendering on text change (debounced 500ms)
- "Confirm Blueprint" button (enabled when diagram is valid)
- Optional: NL feedback textbox for requesting AI modifications
- CSS: `src/mcp_feedback_enhanced/web/static/css/wizard/plan-stage.css`

**1.10 Create Wizard WebSocket Handler**

- File: `src/mcp_feedback_enhanced/web/routes/wizard_routes.py`
- New WebSocket endpoint `/ws/wizard`
- Handle messages:
                                                                - `mode_selected` → create wizard session, start workflow
                                                                - `confirm_blueprint` → save final diagram, transition to Execute
                                                                - `request_ai_update` → send user feedback to AI, regenerate diagram
                                                                - `heartbeat` → keep session alive

**1.11 Update FastAPI Routes**

- Add GET `/wizard` route to serve wizard.html
- Add wizard-specific API endpoints:
                                                                - GET `/api/wizard/status` - current session state
                                                                - POST `/api/wizard/rollback` - go back to previous stage

#### Testing & Integration

**1.12 Unit Tests**

- File: `tests/unit/wizard/test_session.py`
- Test WizardSession state transitions
- Test blueprint versioning

- File: `tests/unit/wizard/test_engine.py`
- Test WorkflowEngine stage progression
- Mock AI responses

**1.13 Integration Test**

- File: `tests/integration/test_wizard_plan_stage.py`
- Full flow: Start wizard → Mode selection → Plan stage → Confirm blueprint
- Use real WebSocket connection to local server
- Verify session state changes

**Phase 1 Deliverable:** Users can select Spec-First mode, see AI-generated Mermaid diagram, edit it, and confirm to advance.

---

### Phase 2: Execute Stage - Tests & Code (Weeks 3-4)

**Goal:** Complete the core workflow loop - blueprint drives test and code generation

#### Backend Tasks

**2.1 Create Execute Stage Handlers**

- File: `src/mcp_feedback_enhanced/wizard/stages/execute_handler.py`
- `ExecuteTestsHandler` - generates test cases from blueprint
- `ExecuteCodeHandler` - generates code from blueprint + tests
- Inject blueprint text into prompt context

**2.2 Test Case Prompt Template**

- File: `src/mcp_feedback_enhanced/wizard/prompts/execute_tests.txt`
- Template that includes confirmed blueprint
- Instructs AI to generate 5-10 critical test cases
- Output format: structured list or table-friendly

**2.3 Code Generation Prompt Template**

- File: `src/mcp_feedback_enhanced/wizard/prompts/execute_code.txt`
- Strong constraints: "Follow blueprint EXACTLY", "Do not add features"
- Inject blueprint text and approved test cases
- Request code in fenced blocks with file paths

**2.4 Session Methods for Execute**

- `WizardSession.save_test_cases(tests: List[Dict])`
- `WizardSession.approve_tests(final_tests: List[Dict])`
- `WizardSession.save_generated_code(code: str)`
- Update `current_stage` tracking

#### Frontend Tasks

**2.5 Create Execute Tests UI**

- File: `src/mcp_feedback_enhanced/web/static/js/wizard/execute-tests.js`
- Display test cases in editable table:
                                                                - Columns: # | Test Description | Expected Outcome | Actions
                                                                - Inline editing for descriptions
                                                                - Add/delete test case buttons
- "Approve Tests & Generate Code" button
- CSS: `src/mcp_feedback_enhanced/web/static/css/wizard/execute-tests.css`

**2.6 Create Execute Code UI**

- File: `src/mcp_feedback_enhanced/web/static/js/wizard/execute-code.js`
- Display generated code in syntax-highlighted blocks
- If multiple files, use tabs or accordion
- "Copy Code" button per file
- "Proceed to Review" button
- CSS: `src/mcp_feedback_enhanced/web/static/css/wizard/execute-code.css`

**2.7 Update WebSocket Handler**

- Handle `approve_tests` message → transition to code generation
- Handle `proceed_to_review` → transition to Refine stage
- Stream code generation if AI supports it (for long outputs)

#### Testing

**2.8 Integration Tests**

- File: `tests/integration/test_wizard_execute.py`
- Full flow: Plan → Execute Tests → Execute Code
- Verify blueprint text is passed to AI prompts
- Verify test cases are captured and editable
- Mock or use real AI (OpenAI API with test key)

**Phase 2 Deliverable:** Complete Plan → Execute flow with test approval and code generation

---

### Phase 3: Refine Stage + Backward Navigation (Weeks 5-6)

**Goal:** Final review, acceptance, and ability to iterate

#### Backend Tasks

**3.1 Create Refine Stage Handler**

- File: `src/mcp_feedback_enhanced/wizard/stages/refine_handler.py`
- In V1: Manual review (no auto-verification)
- Present blueprint + code side-by-side
- User can Accept or Go Back

**3.2 Implement Rollback Logic**

- `WorkflowEngine.rollback_stage(session, target_stage)`
- Clear downstream artifacts (if rolling back to Plan, clear tests/code)
- Restore previous blueprint version
- Update session state

**3.3 Session Completion Tracking**

- `WizardSession.accept_code()` → mark session as COMPLETED
- Log success event for metrics
- Cleanup session but keep for history/export

**3.4 Metrics Logging**

- File: `src/mcp_feedback_enhanced/wizard/metrics.py`
- Log events:
                                                                - `wizard_started` (routine_id, timestamp)
                                                                - `stage_completed` (stage, duration)
                                                                - `blueprint_confirmed` (version_count)
                                                                - `tests_approved` (test_count, edited: bool)
                                                                - `code_accepted` (success: true)
                                                                - `workflow_abandoned` (last_stage)
- Calculate Happy Path Completion Rate

#### Frontend Tasks

**3.5 Create Refine Stage UI**

- File: `src/mcp_feedback_enhanced/web/static/js/wizard/refine-review.js`
- Side-by-side view:
                                                                - Left: Blueprint diagram (read-only, rendered)
                                                                - Right: Generated code (scrollable, syntax highlighted)
- Buttons:
                                                                - "Accept Code" (green, primary)
                                                                - "Revise Blueprint" (secondary, triggers rollback)
- Checklist of manual verification items (optional helper)

**3.6 Update WebSocket Handler**

- Handle `accept_code` → finalize session, log completion
- Handle `rollback_to_stage` → engine rollback, update UI to target stage

**3.7 Add Success/Completion Screen**

- File: `src/mcp_feedback_enhanced/web/templates/wizard_complete.html`
- Show completion message
- Option to export session data (diagram, tests, code as JSON/Markdown)
- "Start New Workflow" button

#### Testing

**3.8 End-to-End Test**

- File: `tests/integration/test_wizard_full_flow.py`
- Complete RIPER-5 flow: Mode select → Plan → Execute Tests → Execute Code → Refine → Accept
- Verify metrics logged correctly
- Test rollback: Accept page → Back to Plan → Re-confirm → Accept again

**Phase 3 Deliverable:** Fully functional core workflow with acceptance and iteration capability

---

### Phase 4: Read & Insight Stages (Week 7)

**Goal:** Add lightweight intro stages for context gathering

#### Backend Tasks

**4.1 Create Read Stage Handler**

- File: `src/mcp_feedback_enhanced/wizard/stages/read_handler.py`
- Analyze project context (files, structure)
- AI summarizes existing code/requirements
- Mostly AI-driven, minimal user input

**4.2 Create Insight Stage Handler**

- File: `src/mcp_feedback_enhanced/wizard/stages/insight_handler.py`
- AI clarifies task approach
- May ask user clarifying questions
- Lightweight - can be skipped if user already selected mode

**4.3 Prompt Templates**

- `src/mcp_feedback_enhanced/wizard/prompts/read_stage.txt`
- `src/mcp_feedback_enhanced/wizard/prompts/insight_stage.txt`

#### Frontend Tasks

**4.4 Read/Insight UI**

- File: `src/mcp_feedback_enhanced/web/static/js/wizard/read-insight.js`
- Chat-like interface (reuse existing feedback UI patterns)
- AI displays analysis, user can provide clarifications
- "Continue to Planning" button

**4.5 Update Workflow Start**

- Start wizard at Read stage by default
- Allow skipping directly to Plan if context is clear

**Phase 4 Deliverable:** Complete 5-stage RIPER-5 workflow

---

### Phase 5: Polish & Production Readiness (Weeks 8-9)

#### Code Quality

**5.1 Error Handling**

- Graceful AI failures (show message, allow retry)
- WebSocket disconnection recovery
- Invalid Mermaid syntax handling
- Session timeout with save-state

**5.2 UI/UX Improvements**

- Upgrade to CodeMirror 6 for Mermaid editor
- Add syntax highlighting and error markers
- Loading states and progress indicators
- Keyboard shortcuts (Ctrl+Enter to confirm, etc.)
- Responsive design for different screen sizes

**5.3 Internationalization**

- Add wizard UI text to `src/mcp_feedback_enhanced/web/locales/`
- Support en, zh-CN, zh-TW
- Stage names, button labels, instructions

**5.4 Documentation**

- Update README with Wizard usage
- Add `docs/wizard/` folder:
                                                                - `user-guide.md` - how to use The Wizard
                                                                - `developer-guide.md` - architecture and extending
                                                                - `api-reference.md` - WebSocket message types
- Inline code documentation

**5.5 Session Management**

- Auto-cleanup for abandoned sessions
- Session export/import (save progress)
- History view (past wizard sessions)

#### Testing & Validation

**5.6 Comprehensive Test Suite**

- Unit test coverage >80%
- Integration tests for all stage transitions
- WebSocket message handling tests
- Error scenario tests (AI timeout, invalid input, etc.)

**5.7 Manual QA Testing**

- Test in different environments (local, SSH, WSL)
- Test with various project types
- Test backward navigation edge cases
- Performance testing (large diagrams, long code)

**5.8 AI Prompt Tuning**

- Iterate on prompt templates based on actual AI outputs
- Add few-shot examples if needed
- Tune for consistent Mermaid syntax
- Ensure AI follows "strict blueprint adherence" in code gen

**Phase 5 Deliverable:** Production-ready MLP with polished UX and comprehensive testing

---

### Phase 6: Deployment & Monitoring (Week 10)

#### Deployment

**6.1 Package Updates**

- Update `pyproject.toml` dependencies
- Add mermaid.js, CodeMirror to frontend assets
- Version bump to v1.0.0-beta

**6.2 Build Scripts**

- Ensure `make build-desktop` includes wizard assets
- Test installation via pip

**6.3 Release Notes**

- Document in `RELEASE_NOTES/CHANGELOG.md`
- Feature list for The Wizard V1
- Breaking changes from mcp-feedback-enhanced

#### Monitoring

**6.4 Metrics Dashboard**

- Aggregate wizard session logs
- Calculate completion rate
- Track stage duration averages
- Identify abandonment points

**6.5 User Feedback**

- Add in-app feedback mechanism
- Track common error patterns
- Collect UX improvement suggestions

**Phase 6 Deliverable:** Released The Wizard V1 MLP with monitoring

---

## Key Files & Directory Structure

```
src/mcp_feedback_enhanced/
├── wizard/                          # NEW: Wizard-specific code
│   ├── __init__.py
│   ├── session.py                   # WizardSession class
│   ├── engine.py                    # WorkflowEngine, state machine
│   ├── manager.py                   # WizardUIManager
│   ├── registry.py                  # RoutineRegistry
│   ├── metrics.py                   # Logging and metrics
│   ├── stages/                      # Stage handlers
│   │   ├── __init__.py
│   │   ├── base.py                  # BaseStageHandler
│   │   ├── read_handler.py
│   │   ├── insight_handler.py
│   │   ├── plan_handler.py
│   │   ├── execute_handler.py
│   │   └── refine_handler.py
│   ├── prompts/                     # Prompt templates
│   │   ├── read_stage.txt
│   │   ├── insight_stage.txt
│   │   ├── plan_stage.txt
│   │   ├── execute_tests.txt
│   │   ├── execute_code.txt
│   │   └── refine_stage.txt
│   └── routines/                    # Workflow definitions
│       └── riper5.json              # RIPER-5 routine config
├── web/
│   ├── templates/
│   │   └── wizard.html              # NEW: Main wizard UI
│   ├── static/
│   │   ├── js/
│   │   │   └── wizard/              # NEW: Wizard JS modules
│   │   │       ├── mode-selector.js
│   │   │       ├── plan-editor.js
│   │   │       ├── execute-tests.js
│   │   │       ├── execute-code.js
│   │   │       ├── refine-review.js
│   │   │       ├── read-insight.js
│   │   │       └── wizard-app.js    # Main wizard controller
│   │   └── css/
│   │       └── wizard/              # NEW: Wizard styles
│   │           ├── wizard-main.css
│   │           ├── plan-stage.css
│   │           ├── execute-tests.css
│   │           └── execute-code.css
│   └── routes/
│       └── wizard_routes.py         # NEW: Wizard-specific routes
└── server.py                        # MODIFY: Add start_wizard tool

tests/
├── unit/
│   └── wizard/                      # NEW: Wizard unit tests
│       ├── test_session.py
│       ├── test_engine.py
│       └── test_handlers.py
└── integration/
    └── test_wizard_flow.py          # NEW: End-to-end tests

docs/
└── wizard/                          # NEW: Wizard documentation
    ├── user-guide.md
    ├── developer-guide.md
    └── api-reference.md
```

---

## Dependencies

### Python (add to pyproject.toml)

```toml
[project]
dependencies = [
    # Existing dependencies...
    "aiofiles>=23.2.1",       # Async file operations for prompts
    "jinja2>=3.1.2",          # Already present, used for templates
]
```

### JavaScript (CDN or npm)

```javascript
// In wizard.html <head>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
// Phase 5: Add CodeMirror 6
<script src="https://cdn.jsdelivr.net/npm/codemirror@6"></script>
```

---

## Risk Mitigation

### Risk 1: AI Output Inconsistency

**Mitigation:**

- Extensive prompt engineering with few-shot examples
- Output format validation (check for Mermaid syntax)
- Fallback messages if AI fails to follow instructions
- Allow user to manually fix AI output

### Risk 2: Complex State Management

**Mitigation:**

- Explicit state machine with clear transition rules
- Comprehensive logging at each transition
- Unit tests for all state transitions
- State visualization in UI (progress bar)

### Risk 3: WebSocket Reliability

**Mitigation:**

- Implement reconnection logic (already in codebase)
- Periodic session state saves
- Heartbeat mechanism to detect disconnections
- Graceful degradation (REST fallback if WS fails)

### Risk 4: Mermaid Rendering Performance

**Mitigation:**

- Debounce rendering (500ms delay after typing stops)
- Limit diagram complexity (warn if >100 nodes)
- Lazy rendering (only render visible pane)
- Fallback to text view if rendering fails

### Risk 5: Backward Navigation Data Integrity

**Mitigation:**

- Version all artifacts (blueprint, tests, code)
- Clear downstream data when rolling back
- Confirmation dialog before rollback (warn about lost work)
- Keep history for potential undo

---

## Success Metrics

### Phase 1-3 (Core Workflow)

- [ ] User can complete Plan → Execute → Accept in <10 minutes
- [ ] Blueprint editing works with real-time preview
- [ ] Test case approval captures user edits
- [ ] Code generation includes confirmed blueprint in context
- [ ] Session state persists across page refresh

### Phase 4-5 (Complete Product)

- [ ] All 5 RIPER-5 stages functional
- [ ] UI is responsive and intuitive (manual QA pass)
- [ ] Error handling covers 90% of failure scenarios
- [ ] Test coverage >80%
- [ ] Documentation complete

### Phase 6 (Production)

- [ ] Happy Path Completion Rate >60% (from logs)
- [ ] Average session duration <15 minutes
- [ ] <5% session abandonment in Execute stage
- [ ] User feedback score >4/5

---

## Next Steps After Plan Approval

1. **Set up development environment**

                                                                                                - Create `wizard/` directory structure
                                                                                                - Install dependencies
                                                                                                - Set up test framework

2. **Start Phase 1 Implementation**

                                                                                                - Begin with WizardSession class (foundation)
                                                                                                - Then WorkflowEngine (core logic)
                                                                                                - Then Plan stage UI (user-facing validation)

3. **Iterative Development**

                                                                                                - Complete one phase before moving to next
                                                                                                - Demo after each phase for feedback
                                                                                                - Adjust plan based on learnings

4. **Continuous Testing**

                                                                                                - Write tests alongside features
                                                                                                - Run integration tests daily
                                                                                                - Manual QA at phase boundaries

---

## Timeline Summary

| Phase | Duration | Focus | Deliverable |

|-------|----------|-------|-------------|

| 1 | 2 weeks | Foundation + Plan Stage | Mermaid editor working |

| 2 | 2 weeks | Execute Stage | Tests & Code generation |

| 3 | 2 weeks | Refine + Iteration | Complete core loop |

| 4 | 1 week | Read & Insight | All 5 stages |

| 5 | 2 weeks | Polish & Testing | Production quality |

| 6 | 1 week | Deploy & Monitor | Released MLP |

| **Total** | **10 weeks** | | **The Wizard V1** |

---

## Appendix: Code Examples

### Example: WizardSession State Transition

```python
# In wizard/session.py
class WizardSession:
    def transition_to_stage(self, new_stage: str, data: Optional[Dict] = None):
        """Transition to a new stage with validation"""
        valid_transitions = {
            "read": ["insight"],
            "insight": ["plan"],
            "plan": ["execute_tests"],
            "execute_tests": ["execute_code"],
            "execute_code": ["refine"],
            "refine": ["completed", "plan"]  # Can go back to plan
        }

        if new_stage not in valid_transitions.get(self.current_stage, []):
            raise InvalidTransitionError(
                f"Cannot transition from {self.current_stage} to {new_stage}"
            )

        self.current_stage = new_stage
        self.stage_completed[self.current_stage] = False

        if data:
            self._save_stage_data(new_stage, data)

        logger.info(f"Session {self.session_id} transitioned to {new_stage}")
```

### Example: Mermaid Editor Component

```javascript
// In wizard/plan-editor.js
class MermaidEditor {
    constructor(containerEl) {
        this.container = containerEl;
        this.sourceEditor = containerEl.querySelector('#mermaid-source');
        this.preview = containerEl.querySelector('#mermaid-preview');
        this.confirmBtn = containerEl.querySelector('#confirm-blueprint');

        this.setupEventListeners();
        mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    }

    setupEventListeners() {
        let debounceTimer;
        this.sourceEditor.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => this.renderPreview(), 500);
        });

        this.confirmBtn.addEventListener('click', () => this.handleConfirm());
    }

    async renderPreview() {
        const mermaidCode = this.sourceEditor.value;
        try {
            const { svg } = await mermaid.render('preview-diagram', mermaidCode);
            this.preview.innerHTML = svg;
            this.confirmBtn.disabled = false;
        } catch (error) {
            this.preview.innerHTML = `<div class="error">Invalid Mermaid syntax: ${error.message}</div>`;
            this.confirmBtn.disabled = true;
        }
    }

    handleConfirm() {
        const finalDiagram = this.sourceEditor.value;
        window.wizardApp.sendMessage({
            type: 'confirm_blueprint',
            data: { blueprint: finalDiagram }
        });
    }
}
```

### Example: Plan Stage Prompt Template

````
# prompts/plan_stage.txt

You are an expert software architect assisting a developer with system design.

The developer has described their requirements:
"""
{user_requirements}
"""

Project context:
{project_context}

Your task: Create a solution design blueprint using Mermaid diagram syntax.

Requirements:
1. Output a Mermaid flowchart or sequence diagram showing the main process flow
2. Include key components, data flow, and decision points
3. Keep the diagram clear and focused (5-15 nodes ideal)
4. Use proper Mermaid syntax (v10+)

Output format:
- Start with: ```mermaid
- Include the diagram code
- End with: ```
- Optionally add a brief 1-2 sentence explanation after the code block

Example:
```mermaid
flowchart TD
    A[User Request] --> B{Validate Input}
    B -->|Valid| C[Process Data]
    B -->|Invalid| D[Return Error]
    C --> E[Save to DB]
    E --> F[Return Success]
````

Now create the blueprint for the requirements above.

```

---

**End of Implementation Plan**

This plan provides a comprehensive roadmap to transform mcp-feedback-enhanced into The Wizard V1. Each phase builds incrementally, ensuring working software at each milestone. The plan prioritizes the core workflow (Plan → Execute → Refine) first, then adds surrounding stages and polish.
