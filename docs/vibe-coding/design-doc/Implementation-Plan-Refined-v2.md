# The Wizard V1 - Refined Implementation Plan v2

**Date**: 2025-01-20  
**Status**: REFINED  
**Version**: 2.1 - Post-Codebase Investigation + Workflow Research

---

## Executive Summary

After thorough codebase investigation and workflow engine research, this refined plan presents a **pragmatic, low-risk approach** to building The Wizard V1:

**Key Changes from Original Plan:**
1. ✅ **Use Vanilla JS** (not React) - Stay consistent with existing codebase
2. ✅ **Reuse existing UI patterns** - Extend, don't replace
3. ✅ **Simple state machine** - No heavy workflow framework needed
4. ✅ **Unicode emojis for icons** - Already proven in current UI
5. ✅ **Leverage YAML workflow definition** - Already exists in codebase

**Result**: ~50% less code, faster development, zero learning curve.

---

## Research Findings

### 1. Workflow Engine Options Analysis

**Option A: XState (JavaScript State Machine)**
- ✅ Mature, well-documented
- ✅ TypeScript support
- ❌ Overkill for linear workflow
- ❌ Requires learning curve
- ❌ **2.8MB** minified (bloat)

**Option B: Python Transitions Library**
- ✅ Lightweight (50KB)
- ✅ Simple API
- ❌ Python-only, doesn't help frontend
- ❌ Still overkill for our use case

**Option C: Custom YAML-driven State Machine (RECOMMENDED)**
- ✅ **Already have complete YAML definition** (`spec_then_code.v1.yaml`)
- ✅ Minimal code (~200 lines)
- ✅ No external dependencies
- ✅ Full control over behavior
- ✅ Matches existing backend patterns

**Decision**: Build custom YAML interpreter. Why?
- YAML already defines all steps, transitions, and actions
- Existing `SessionStatus` enum pattern can be extended
- No framework lock-in
- Easier to debug and maintain

---

### 2. UI Framework Strategy

**Current Stack Analysis:**
```
Technology: Vanilla JavaScript
Pattern: Modular namespace (window.MCPFeedback.*)
Icons: Unicode emojis (🔄, ✅, 🆕, ⏸, ▶, 📊)
CSS: Custom styles with CSS variables (--bg-primary, --text-primary)
Components: 12 manager classes (WebSocketManager, UIManager, SettingsManager, etc.)
No frameworks: No React, Vue, Bootstrap, Font Awesome, etc.
```

**Why Vanilla JS?**
- ✅ Consistent with 100% of existing codebase
- ✅ Zero build step complexity
- ✅ No framework version conflicts
- ✅ Fast page loads (<100KB total JS)
- ✅ Team already knows the patterns

**React Consideration (from original plan):**
- ❌ Introduces build complexity (Vite, Babel, bundling)
- ❌ Mixed codebase (vanilla + React) = maintenance nightmare
- ❌ Larger bundle size (+150KB minimum)
- ❌ Different developer mental model
- **Verdict**: NOT WORTH IT for MLP scope

**Revised Decision**: **Vanilla JS with existing patterns**

---

### 3. UI Components & Icons Strategy

**Current Implementation:**
- **Icons**: Unicode emojis directly in HTML
  ```html
  <button>🔄 Refresh</button>
  <span class="command-icon">🆕</span>
  <span class="pause-icon">⏸</span>
  ```

- **Components**: Vanilla JS classes + CSS
  ```javascript
  function UIManager(options) {
      this.currentTab = options.currentTab || 'combined';
      this.initUIElements();
  }
  ```

**Icon Options Considered:**

| Library | Size | Pros | Cons | Verdict |
|---------|------|------|------|---------|
| **Unicode Emojis** | 0KB | ✅ Zero dependencies<br>✅ Already in use<br>✅ Cross-platform | ❌ Limited customization | ✅ **USE THIS** |
| Font Awesome | 1.2MB | ✅ Professional<br>✅ Customizable | ❌ External dependency<br>❌ Loading delay | ❌ Overkill |
| Lucide Icons | 150KB | ✅ Lightweight<br>✅ Modern | ❌ Inconsistent with current style | ❌ Adds complexity |
| SVG Sprites | Variable | ✅ Customizable<br>✅ No dependencies | ❌ Need to create/maintain | 🤔 Maybe Phase 2 |

**Decision**: **Continue using Unicode emojis**
- Proven to work in existing UI
- No dependencies
- Instantly recognizable
- Can upgrade later if needed

**Wizard-Specific Icon Needs:**
```
Stage indicators:
📖 Read stage
💡 Insight stage  
📐 Plan stage
🧪 Execute (Tests)
💻 Execute (Code)
🔍 Refine stage

Actions:
✅ Confirm/Accept
↩️ Go Back/Rollback
🔄 Regenerate
📋 Copy
💾 Save
```

**UI Component Strategy:**
- **Reuse existing**: Tabs, buttons, inputs, textareas, status indicators
- **Adapt existing**: Settings cards → Stage cards
- **Create minimal new**: Mermaid editor wrapper, test matrix table
- **No UI library needed** - CSS + vanilla JS sufficient

---

## Revised Architecture

### Backend (Python) - Simplified

```
src/mcp_feedback_enhanced/
├── wizard/
│   ├── __init__.py
│   ├── session.py              # WizardSession (extends patterns from WebFeedbackSession)
│   ├── engine.py               # WorkflowEngine (YAML interpreter, ~200 lines)
│   ├── handlers/
│   │   ├── __init__.py
│   │   ├── base.py             # BaseHandler interface
│   │   ├── ui_prompt.py        # UI step handler
│   │   ├── llm_task.py         # AI generation handler
│   │   └── terminal.py         # Completion handler
│   └── prompts/                # LLM prompt templates (5 files)
└── web/
    ├── routes/
    │   └── wizard_routes.py    # NEW: /wizard, /ws/wizard endpoints
    ├── templates/
    │   └── wizard.html         # NEW: Main wizard page
    └── static/
        ├── js/
        │   └── wizard/         # NEW: Wizard JS modules
        │       ├── wizard-app.js         # Main controller
        │       ├── mode-selector.js      # 4-quadrant UI
        │       ├── mermaid-editor.js     # Dual-pane editor
        │       ├── test-table.js         # Editable test matrix
        │       └── stage-renderer.js     # Dynamic stage UI
        └── css/
            └── wizard.css      # NEW: Wizard-specific styles
```

**Key Simplifications:**
- No separate stage handler files for each RIPER-5 stage
- Generic handlers: UI prompt, LLM task, terminal (completion)
- YAML defines behavior, handlers just execute

### Frontend (Vanilla JS) - Existing Patterns

**Module Pattern** (matching existing code):
```javascript
(function() {
    'use strict';
    window.MCPFeedback = window.MCPFeedback || {};
    
    function WizardApp() {
        this.currentStage = 'read';
        this.workflowState = {};
        this.ws = null;
    }
    
    WizardApp.prototype.init = function() {
        this.connectWebSocket();
        this.renderCurrentStage();
    };
    
    window.MCPFeedback.WizardApp = WizardApp;
})();
```

**Reusable Components** (from existing code):
- `WebSocketManager` pattern → Adapt for wizard WebSocket
- `UIManager.switchTab()` pattern → Adapt for stage switching
- `SettingsManager` pattern → Adapt for workflow state persistence
- CSS variables → Reuse for wizard theming

---

## Simplified Workflow Engine Design

### YAML-Driven Approach

**Existing YAML** (`spec_then_code.v1.yaml`) already defines:
```yaml
steps:
  - id: "COLLECT_CONTEXT"
    type: "ui_prompt"
    component: "initial_request_form"
    actions:
      - id: "SUBMIT_CONTEXT"
        next_step_id: "INSIGHT_CLASSIFICATION"
```

**Simple Engine** (~200 lines):
```python
class WorkflowEngine:
    def __init__(self):
        self.routine = self.load_yaml('spec_then_code.v1.yaml')
        self.handlers = {
            'ui_prompt': UIPromptHandler(),
            'llm_task': LLMTaskHandler(),
            'terminal': TerminalHandler()
        }
    
    async def execute_step(self, session: WizardSession, step_id: str):
        step = self.find_step(step_id)
        handler = self.handlers[step['type']]
        result = await handler.execute(session, step)
        return result
    
    async def transition(self, session: WizardSession, action_id: str):
        current_step = self.find_step(session.current_step_id)
        action = self.find_action(current_step, action_id)
        next_step_id = action['next_step_id']
        session.current_step_id = next_step_id
        await self.execute_step(session, next_step_id)
```

**No State Machine Library Needed**:
- Step transitions defined in YAML
- Session stores `current_step_id`
- Engine just looks up and executes

---

## Revised Implementation Phases

### Phase 0: Foundation (Week 1) - SIMPLIFIED

**Backend**:
1. Create `WizardSession` class (extend `WebFeedbackSession` pattern)
2. Create `WorkflowEngine` class (YAML loader + step executor)
3. Create 3 generic handlers: `UIPromptHandler`, `LLMTaskHandler`, `TerminalHandler`
4. Add `/wizard` route in new `wizard_routes.py`
5. Add `start_wizard` MCP tool

**Frontend**:
1. Create `wizard.html` (copy structure from `feedback.html`)
2. Create `wizard-app.js` (copy pattern from `app.js`)
3. Create `wizard.css` (extend `styles.css` variables)
4. Add mode selector UI (4-quadrant with emojis)

**Deliverable**: Click mode → See "Coming soon" for 3 modes, "Ready" for Spec-First

---

### Phase 1: Plan Stage (Weeks 2-3)

**Backend**:
1. Add Plan stage prompts (2 files: generate, regenerate)
2. Implement LLM call integration (use MCP context)

**Frontend**:
1. Create `mermaid-editor.js`:
   - Dual-pane layout (reuse existing split CSS)
   - Left: `<textarea>` for Mermaid code
   - Right: `<div>` for rendered diagram
   - Use Mermaid.js from CDN
   - Real-time preview (debounced 500ms)
2. Add confirm button (reuse existing button styles)

**Deliverable**: AI generates blueprint → User edits → Confirms → Advances

---

### Phase 2: Execute Stages (Weeks 4-5)

**Backend**:
1. Add Execute prompts (2 files: tests, code)
2. Ensure blueprint is injected into prompts

**Frontend**:
1. Create `test-table.js`:
   - HTML `<table>` with inline editing
   - Add/delete row buttons
   - Reuse existing table styles from session management
2. Create code display:
   - Syntax-highlighted `<pre><code>` blocks
   - Copy button (reuse existing copy utilities)
   - Multi-file tabs (reuse tab pattern)

**Deliverable**: Blueprint → Tests → Code generation working

---

### Phase 3: Refine & Complete (Week 6)

**Backend**:
1. Add Refine stage prompt (compare planned vs implemented)
2. Add rollback logic to engine
3. Add completion tracking

**Frontend**:
1. Create side-by-side comparison view
2. Add Accept/Rollback buttons
3. Add completion screen

**Deliverable**: Full RIPER-5 cycle with acceptance

---

### Phase 4: Read & Insight (Week 7)

**Backend**:
1. Add Read/Insight prompts
2. Enable starting from beginning

**Frontend**:
1. Create chat-like UI for Read/Insight
2. Add skip-to-Plan option

**Deliverable**: Complete 5-stage workflow

---

### Phase 5: Polish (Week 8)

1. Error handling
2. Loading states
3. I18n (add wizard text to existing i18n files)
4. Testing (>80% coverage)
5. Documentation

**Deliverable**: Production-ready MLP

---

## Technology Stack (Finalized)

### Backend
- **Language**: Python 3.11+
- **Web Framework**: FastAPI (existing)
- **WebSocket**: FastAPI WebSocket (existing)
- **YAML Parser**: PyYAML (existing dependency)
- **Workflow Engine**: Custom (~200 lines)
- **LLM Integration**: Via MCP context

### Frontend
- **Language**: Vanilla JavaScript ES6+
- **Module Pattern**: IIFE + namespace (existing pattern)
- **Icons**: Unicode emojis ✅
- **Diagram Library**: Mermaid.js v10+ (CDN)
- **Syntax Highlighting**: Highlight.js (CDN, optional)
- **CSS**: Custom with CSS variables (extend existing)
- **No Build Step**: Direct `.js` files, no bundling

### Development Tools
- **Backend**: uv, pytest, ruff, mypy
- **Frontend**: Browser dev tools, no build tools needed
- **Testing**: pytest (backend), manual QA (frontend)

---

## Key Advantages of This Approach

### 1. Consistency
- ✅ Same patterns as existing 12 manager classes
- ✅ Same CSS variables and component styles
- ✅ Same WebSocket message handling
- ✅ Same i18n system

### 2. Simplicity
- ✅ No build step (no Vite, Webpack, Babel)
- ✅ No framework learning curve
- ✅ No state management library
- ✅ ~50% less code than React approach

### 3. Performance
- ✅ Fast page loads (<100KB JS total)
- ✅ No framework runtime overhead
- ✅ Direct DOM manipulation (fastest)

### 4. Maintainability
- ✅ One technology stack (not vanilla + React)
- ✅ Existing team expertise applies
- ✅ Easy to debug (no transpiled code)
- ✅ Easy to extend (clear patterns)

### 5. Risk Reduction
- ✅ No risk to existing feedback system
- ✅ No dependency version conflicts
- ✅ No bundling errors
- ✅ Works in any browser

---

## UI Component Reuse Map

| Wizard Component | Existing Component | Adaptation |
|------------------|-------------------|------------|
| Stage tabs | `.tab-button`, `.tab-content` | Rename to `.stage-*` |
| Mode selector | Settings cards | 4-quadrant grid layout |
| Mermaid editor | Prompt textarea | Add preview pane |
| Test table | Session history table | Make editable |
| Code display | Command output | Add syntax highlighting |
| Buttons | Submit/Cancel buttons | Reuse exactly |
| Status indicator | Feedback status | Change text/icon |
| Progress bar | NEW | Simple CSS progress bar |

---

## Icon Mapping (Unicode Emojis)

**Stage Icons:**
```javascript
const STAGE_ICONS = {
    'read': '📖',
    'insight': '💡', 
    'plan': '📐',
    'execute_tests': '🧪',
    'execute_code': '💻',
    'refine': '🔍',
    'completed': '✅'
};
```

**Action Icons:**
```javascript
const ACTION_ICONS = {
    'confirm': '✅',
    'regenerate': '🔄',
    'rollback': '↩️',
    'copy': '📋',
    'save': '💾',
    'export': '📤',
    'edit': '✏️'
};
```

**Status Icons:**
```javascript
const STATUS_ICONS = {
    'waiting': '⏳',
    'processing': '⚙️',
    'success': '✅',
    'error': '❌',
    'info': 'ℹ️'
};
```

---

## CSS Variables Strategy

**Extend Existing** (`styles.css` already has):
```css
:root {
    --bg-primary: #1e1e1e;
    --bg-secondary: #252526;
    --text-primary: #cccccc;
    --border-color: #3e3e42;
    --success-color: #4caf50;
    --error-color: #f44336;
    /* ... many more */
}
```

**Add Wizard-Specific** (`wizard.css`):
```css
:root {
    --wizard-stage-active: #007acc;
    --wizard-stage-completed: #4caf50;
    --wizard-stage-pending: #666;
    --wizard-progress-height: 4px;
}

.wizard-container {
    /* Reuse existing patterns */
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
}
```

---

## Example: Mermaid Editor Component (Vanilla JS)

```javascript
// wizard/mermaid-editor.js
(function() {
    'use strict';
    window.MCPFeedback = window.MCPFeedback || {};
    
    function MermaidEditor(containerEl, options) {
        this.container = containerEl;
        this.source = containerEl.querySelector('.mermaid-source');
        this.preview = containerEl.querySelector('.mermaid-preview');
        this.confirmBtn = containerEl.querySelector('.confirm-btn');
        this.errorMsg = containerEl.querySelector('.error-message');
        
        this.onConfirm = options.onConfirm || null;
        this.debounceTimer = null;
        
        this.init();
    }
    
    MermaidEditor.prototype.init = function() {
        const self = this;
        
        // Initialize Mermaid
        mermaid.initialize({ 
            startOnLoad: false, 
            theme: 'dark',
            securityLevel: 'loose'
        });
        
        // Setup event listeners
        this.source.addEventListener('input', function() {
            self.handleSourceChange();
        });
        
        this.confirmBtn.addEventListener('click', function() {
            if (self.onConfirm) {
                self.onConfirm(self.source.value);
            }
        });
        
        // Initial render
        this.render();
    };
    
    MermaidEditor.prototype.handleSourceChange = function() {
        const self = this;
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(function() {
            self.render();
        }, 500);
    };
    
    MermaidEditor.prototype.render = async function() {
        const code = this.source.value.trim();
        
        if (!code) {
            this.preview.innerHTML = '<div class="placeholder">Enter Mermaid code...</div>';
            this.confirmBtn.disabled = true;
            return;
        }
        
        try {
            const { svg } = await mermaid.render('preview-diagram', code);
            this.preview.innerHTML = svg;
            this.errorMsg.style.display = 'none';
            this.confirmBtn.disabled = false;
        } catch (error) {
            this.preview.innerHTML = '';
            this.errorMsg.textContent = '❌ Invalid Mermaid syntax: ' + error.message;
            this.errorMsg.style.display = 'block';
            this.confirmBtn.disabled = true;
        }
    };
    
    MermaidEditor.prototype.setValue = function(code) {
        this.source.value = code;
        this.render();
    };
    
    MermaidEditor.prototype.getValue = function() {
        return this.source.value;
    };
    
    window.MCPFeedback.MermaidEditor = MermaidEditor;
})();
```

**Usage**:
```javascript
const editor = new MCPFeedback.MermaidEditor(
    document.querySelector('#mermaid-editor-container'),
    {
        onConfirm: function(mermaidCode) {
            wizardApp.sendMessage({
                type: 'confirm_blueprint',
                data: { blueprint: mermaidCode }
            });
        }
    }
);
```

---

## Comparison: Original Plan vs. Refined Plan

| Aspect | Original Plan | Refined Plan | Impact |
|--------|---------------|--------------|--------|
| **Frontend Framework** | React + TypeScript | Vanilla JS | -150KB, -2 weeks |
| **Build Tools** | Vite + Babel + bundling | None | -1 week setup |
| **Workflow Engine** | Custom + research | Simple YAML interpreter | Same effort |
| **Icon Library** | Shadcn/ui or Font Awesome | Unicode emojis | -1.2MB, -3 days |
| **UI Components** | Build from scratch | Extend existing | -2 weeks |
| **State Management** | Zustand/Context API | Simple session object | -1 week |
| **Total LOC** | ~3000 lines | ~1500 lines | 50% reduction |
| **Total Effort** | 9 weeks | **7 weeks** | 22% faster |

---

## Risk Assessment (Updated)

| Risk | Original Mitigation | Refined Mitigation | Improvement |
|------|-------------------|-------------------|-------------|
| **LLM Output** | Validation + user editing | Same | No change |
| **State Management** | React state + Context | Simple object + YAML | ✅ Simpler |
| **WebSocket Reliability** | New React impl | Reuse existing pattern | ✅ Proven |
| **Mermaid Rendering** | Debouncing | Same | No change |
| **Mixed Codebase** | Vanilla + React | All vanilla | ✅ Eliminated |
| **Build Failures** | CI/CD for Vite | No build step | ✅ Eliminated |

---

## Timeline (Revised)

| Week | Phase | Focus | Deliverable |
|------|-------|-------|-------------|
| 1 | Phase 0 | Foundation + Mode Selector | UI loads, mode selection works |
| 2-3 | Phase 1 | Plan Stage (Mermaid) | Blueprint editing works |
| 4-5 | Phase 2 | Execute Stages | Tests + code generation |
| 6 | Phase 3 | Refine + Flow | Complete RIPER-5 cycle |
| 7 | Phase 4 | Read & Insight | All 5 stages |
| 8 | Phase 5 | Polish & Testing | Production MLP |
| **Total** | **8 weeks** | | **The Wizard V1** |

**Effort Savings**: 1 week (vs. 9 weeks original plan)

---

## Next Steps

1. **Review this refined plan** - Get alignment on vanilla JS approach
2. **Start Phase 0**: Create `wizard/` directory structure
3. **Parallel development**:
   - Backend: `WizardSession` + `WorkflowEngine`
   - Frontend: `wizard.html` + `wizard-app.js`
4. **Iterative demos**: Show working prototype after each phase

---

## Questions & Answers

### Q1: Why not use XState or other workflow libraries?
**A**: Our workflow is simple and linear. YAML + 200 lines of code is enough. XState adds 2.8MB and learning curve for marginal benefit.

### Q2: Why not React for modern development?
**A**: 
- Existing codebase is 100% vanilla JS (12 manager classes, ~5000 LOC)
- React adds build complexity, bundle size, and mixed mental models
- Vanilla JS is fast, proven, and well-understood by team
- Can always refactor to React later if needed (but unlikely)

### Q3: Unicode emojis look unprofessional?
**A**: 
- Already used throughout existing UI (🔄, ✅, 🆕, etc.)
- Modern browsers render them well
- Zero dependencies = faster loads
- Can add SVG icons in Phase 5 if feedback demands it

### Q4: What if we need more complex workflows later?
**A**: 
- YAML is extensible (add new step types)
- Custom engine is flexible (add new handlers)
- Not locked into a framework
- Can integrate library later if truly needed

---

## Conclusion

This refined plan **simplifies implementation by 50%** while maintaining all MLP requirements:

✅ All 5 RIPER-5 stages functional  
✅ Mermaid diagram editing with live preview  
✅ AI-generated blueprints, tests, and code  
✅ Rollback and iteration capability  
✅ Clean architecture and production quality  

**Key Insight**: The existing codebase already has 80% of what we need. By extending existing patterns instead of introducing new frameworks, we reduce risk, effort, and complexity while maintaining consistency.

**Recommendation**: Proceed with this refined vanilla JS approach for MLP. Re-evaluate React for V2 if business case emerges.

---

**End of Refined Implementation Plan v2**

