# **The Wizard V1 \- Technical Design Document**

Status: DRAFT  
Author: Alex (SDE III)  
Reviewers: Allen (PM), \[Engineering Manager\], \[Peer SDEs\]

## **1\. Introduction & Goals**

### **1.1. Problem Statement**

*Briefly restate the core problem from the PRD: the trust deficit and cognitive load developers face when using AI in complex codebases.*

### **1.2. Goals**

* Deliver a local-first, web-based tool ("The Wizard") that guides developers through a "Spec-Then-Code" workflow.  
* Leverage the mcp-feedback-enhanced open-source project ([https://github.com/Minidoracat/mcp-feedback-enhanced](https://github.com/Minidoracat/mcp-feedback-enhanced)) to accelerate development of the UI and Cursor IDE communication layer.  
* Validate the core value proposition of the RIPER-5 framework ([https://github.com/NeekChaw/RIPER-5/blob/main/RIPER-5/RIPER-5-EN.md](https://github.com/NeekChaw/RIPER-5/blob/main/RIPER-5/RIPER-5-EN.md)).

### **1.3. Non-Goals**

* A cloud-hosted, multi-tenant service.  
* Achieving specific performance or scalability targets beyond a smooth single-user experience.  
* Implementing authentication, authorization, or advanced data security protocols for V1.

## **2\. Tenets**

*These are our engineering principles for this project.*

1. **Modularity over Monolith:** The core workflow logic (engine) MUST be decoupled from the presentation layer (UI).  
2. **Testability First:** The core engine MUST be testable in isolation, without reliance on the UI framework.  
3. **Accelerate with Open Source:** We will reuse and extend, not reinvent, foundational components like the web server and MCP communication.  
4. **Configuration as Code:** The workflow itself (the RIPER-5 steps) MUST be defined in an external configuration file (YAML), not hardcoded.

## **3\. High-Level Architecture**

*This section describes the chosen "Vendor & Orchestrate" approach, which separates the application's core logic from its user interface and communication layers.*

### **3.1. System Diagram**

\`\`\` mermiad

graph TD  
    subgraph Browser  
        A\[UI Layer \- Streamlit\]  
    end

    subgraph Core Logic  
        B\[Guide Engine \- Python Module\]  
    end

    subgraph IDE  
        D\[Cursor IDE\]  
    end

    C\[User\] \-- Interacts with \--\> A  
    A \-- 1\. Forwards user actions \--\> B  
    B \-- 2\. Returns new state \--\> A  
    A \-- 3\. Renders updated UI \--\> C  
    B \-- 4\. Instructs UI to send command \--\> A  
    A \-- 5\. Calls Gateway function \--\> E{Communication Gateway}  
    E \-- 6\. Sends MCP Command \--\> D

    style B fill:\#f9f,stroke:\#333,stroke-width:2px  
\`\`\`

**Diagram Flow:** The user interacts exclusively with the **UI Layer**. The UI Layer is stateless; it forwards all user actions to the **Guide Engine**. The Guide Engine, our state machine, processes the action, updates its internal state, and tells the UI Layer what to display next. When a workflow step requires interacting with the IDE, the Engine instructs the UI Layer to call the **Communication Gateway**, which sends the final, formatted MCP command to the **Cursor IDE**.

### **3.2. Component Responsibilities**

* **UI Layer (wizard\_app.py, ui\_components.py):**  
  * **Technology:** Streamlit.  
  * **Responsibility:** This component is the "View" of our application. Its sole purpose is to render the user interface based on the current state provided by the Guide Engine. It captures all user interactions (button clicks, text input) and forwards them as structured actions to the Engine. It holds no business logic and is deliberately kept "dumb" to maintain a clean separation of concerns. The main wizard\_app.py will contain the primary application loop, while ui\_components.py will house the definitions for our custom widgets (Blueprint Editor, Test Case Table).  
* **Guide Engine (guide\_engine.py):**  
  * **Technology:** A standard, framework-agnostic Python module/class.  
  * **Responsibility:** This is the "brains" and the core of our product. It implements the RIPER-5 state machine logic. It is initialized with the path to a YAML configuration file that defines the workflow's steps, prompts, and transitions. The engine receives actions from the UI Layer, processes them, manages the session's data (e.g., the current blueprint, test cases), and returns the new state to be rendered. It has no knowledge of Streamlit or the web; it is a pure logic component, which makes it highly testable.  
* **Communication Gateway (a function within ui\_components.py):**  
  * **Technology:** A Python function.  
  * **Responsibility:** This component acts as a dedicated isolation layer for interacting with the Cursor IDE. It exposes a single, simple function (e.g., send\_mcp\_to\_cursor(prompt)). Its only job is to take a string, format it into the specific MCP command structure that Cursor expects, and execute the command. By containing this logic in one place, we insulate the rest of our application from any future changes to the MCP protocol.

## **4\. Deep-Dive Design**

### **4.1. The Guide Framework Engine**

The engine is implemented as a single class, WorkflowEngine, in guide\_engine.py. It is initialized once per user session and its instance is held in st.session\_state.

#### **4.1.1. State Management**

The engine manages the workflow state through a set of instance attributes:

* \_config: A dictionary holding the parsed YAML configuration.  
* \_current\_step\_id: A string that tracks the user's current position in the workflow (e.g., "REVIEW\_BLUEPRINT"). This is the core of the state machine.  
* \_session\_data: A dictionary used as a key-value store for all data generated during the session. This includes the user's initial request, the generated Mermaid code for the blueprint, the structured test cases, and the final generated code prompt. This allows us to pass context between steps.  
* history: A list to store snapshots of \_session\_data at key transition points, enabling the "in-session version control" feature.

The primary method for interaction will be engine.handle\_action(action\_id, payload), which advances the state based on the current step and the action taken.

#### **4.1.2. YAML Configuration Schema**

The engine's behavior is entirely dictated by a YAML file. This allows for rapid iteration on the workflow without changing the core engine code. The V1 schema is defined as follows:

\# spec-then-code.v1.yaml  
\---  
\# Metadata for the workflow  
name: "Spec-Then-Code Workflow"  
description: "A rigorous guide for developing complex business logic with AI."  
start\_step: "GET\_USER\_REQUEST" \# The ID of the first step to execute.

\# A list of all possible steps in the workflow  
steps:  
  \# This is a UI step: it waits for user input  
  \- id: "GET\_USER\_REQUEST"  
    type: "ui\_prompt"  
    component: "initial\_request\_form" \# Tells the UI which widget to render  
    actions:  
      \- label: "Start" \# The text on the button  
        action\_id: "SUBMIT\_REQUEST"  
        next\_step\_id: "START\_PLAN" \# Transition to this step on click

  \# This is a backend step: it calls an LLM  
  \- id: "START\_PLAN"  
    type: "llm\_task"  
    \# Jinja2-style template for the prompt. Variables are pulled from \_session\_data.  
    prompt\_template: \>  
      Based on the user's request: '{{ user\_request }}', generate a sequence  
      diagram in Mermaid format. Output only the Mermaid code.  
    \# The key under which the LLM's output will be saved in \_session\_data  
    output\_key: "blueprint\_mermaid"  
    on\_success: "REVIEW\_BLUEPRINT" \# Transition to this step on success

  \# This is another UI step, but with more complex logic  
  \- id: "REVIEW\_BLUEPRINT"  
    type: "ui\_prompt"  
    component: "blueprint\_editor"  
    actions:  
      \- label: "Confirm Blueprint"  
        action\_id: "CONFIRM\_BLUEPRINT"  
        next\_step\_id: "START\_TEST\_GENERATION"  
      \- label: "Regenerate"  
        action\_id: "REGENERATE\_BLUEPRINT"  
        next\_step\_id: "START\_PLAN"

  \# ... other steps for test generation, code execution, etc. would follow ...

#### **4.1.3. Error Handling Strategy**

The engine will handle errors by raising specific, custom exceptions that the UI layer can catch and interpret.

* ConfigError: Raised during initialization if the YAML file is missing, malformed, or has logical inconsistencies (e.g., a next\_step\_id that doesn't exist).  
* LLMError: Raised if an llm\_task step fails due to an API error, timeout, or if the LLM returns a malformed response that cannot be parsed.  
* StateError: Raised if the UI attempts to perform an action that is not valid in the current state (e.g., clicking "Confirm Blueprint" when the state is still GET\_USER\_REQUEST).

The UI layer (wizard\_app.py) will be responsible for a try...except block around calls to the engine. On catching an exception, it will display a user-friendly error message using st.error() without crashing the entire application.

### **4.2. UI Components**

All UI components will be defined as Python functions in ui\_components.py and orchestrated by the main application loop in wizard\_app.py.

#### **4.2.1. The Main Application Loop (wizard\_app.py)**

The main loop will be responsible for the "Controller" logic in our architecture. On each page render, it will perform the following steps:

1. **Initialize Engine:** Check st.session\_state for an instance of the WorkflowEngine. If one does not exist, create a new instance and store it.  
2. **Get Current State:** Retrieve the current step information from the engine instance (e.g., engine.get\_current\_step()). This will return the step's type (ui\_prompt, llm\_task) and any associated metadata, like which UI component to render.  
3. **Execute/Render:**  
   * If the step type is llm\_task, the loop will automatically execute the task (e.g., call the LLM) and then call engine.handle\_action() to transition to the next step, triggering a re-render. A spinner (st.spinner) will be displayed during execution.  
   * If the step type is ui\_prompt, the loop will use a match/case statement on the component name (e.g., "blueprint\_editor") to call the appropriate rendering function from ui\_components.py.  
4. **Process Actions:** The rendering functions will draw buttons (st.button). If a button is clicked, the main loop will call engine.handle\_action() with the corresponding action\_id from the YAML config, which will update the engine's state and cause a re-render with the new UI.

#### **4.2.2. The Blueprint Editor Component (blueprint\_editor)**

This component fulfills requirement FR-2.2. It will be a function display\_blueprint\_editor(engine) that renders a two-column layout (st.columns(2)).

* **Column 1: Mermaid Source Code:**  
  * A text area (st.text\_area) will be displayed, pre-populated with the Mermaid source code from engine.session\_data\['blueprint\_mermaid'\].  
  * The user can directly edit this text. To persist changes, we will leverage Streamlit's on\_change callback for the text area to update the session data.  
* **Column 2: Rendered Diagram:**  
  * The Mermaid code from the text area will be rendered as a diagram. We will use the streamlit-mermaid community component for this functionality.  
  * This provides the real-time preview capability required by the PRD.  
* **Actions:** Below the columns, the function will render the buttons defined in the YAML for this step (e.g., "Confirm Blueprint", "Regenerate").

#### **4.2.3. The Test Case Table Component (test\_case\_table)**

This component fulfills requirement FR-3.1. It will be a function display\_test\_table(engine) that uses the st.data\_editor component, which is well-suited for this task.

* **Data Structure:** The test cases will be stored in the engine's session data as a list of dictionaries (e.g., \[{'Description': '...', 'Inputs': '...', 'Expected Outcome': '...'}, ...\]). This list will be converted to a Pandas DataFrame to be used as input for the data editor.  
* **Display:** st.data\_editor will render an editable, Excel-like table.  
* **Editing (Modify):** The user can click on any cell and edit the text directly. This is a built-in feature of the data editor.  
* **Editing (Delete):** The data editor can be configured to allow row deletion. The updated DataFrame will be saved back to the engine's session data.  
* **Out of Scope for V1:** Adding new rows (num\_rows="dynamic") will be disabled to adhere to the PRD's scope limits.

### **4.3. Data Flow**

This section outlines the flow of data and state changes for a complete "Happy Path" user session.

1. **Session Start:**  
   * wizard\_app.py runs. It finds no WorkflowEngine instance in st.session\_state.  
   * It creates a new instance: engine \= WorkflowEngine('spec-then-code.v1.yaml').  
   * The engine parses the YAML and sets its internal state \_current\_step\_id to "GET\_USER\_REQUEST". The instance is saved to st.session\_state.  
2. **Step 1: User Submits Request:**  
   * The main loop gets the current step from the engine, which is "GET\_USER\_REQUEST".  
   * It calls the display\_initial\_request\_form() UI function.  
   * The user types "Create an endpoint to fetch user details" and clicks the "Start" button.  
   * The UI loop captures the click and the text input. It calls engine.handle\_action("SUBMIT\_REQUEST", payload={'user\_request': '...'}).  
   * The engine updates its \_session\_data with {'user\_request': '...'}.  
   * Based on the YAML, it transitions its state \_current\_step\_id to "START\_PLAN".  
   * Streamlit re-renders the page.  
3. **Step 2: Blueprint Generation (LLM Task):**  
   * The main loop now sees the current step is "START\_PLAN", which has type llm\_task.  
   * A spinner is displayed to the user.  
   * The loop gets the prompt\_template from the step's config and renders it using \_session\_data.  
   * It calls the LLM with the rendered prompt.  
   * The LLM returns a Mermaid diagram string.  
   * The loop calls engine.handle\_action("LLM\_SUCCESS", payload={'blueprint\_mermaid': '...'}).  
   * The engine saves the Mermaid string to \_session\_data\['blueprint\_mermaid'\].  
   * Based on the YAML's on\_success field, it transitions \_current\_step\_id to "REVIEW\_BLUEPRINT".  
   * Streamlit re-renders the page.  
4. **Step 3: User Reviews Blueprint:**  
   * The main loop sees the state is now "REVIEW\_BLUEPRINT".  
   * It calls the display\_blueprint\_editor(engine) UI function.  
   * The user reviews the diagram and source code. They are satisfied and click "Confirm Blueprint".  
   * The UI loop captures the click and calls engine.handle\_action("CONFIRM\_BLUEPRINT").  
   * The engine transitions \_current\_step\_id to "START\_TEST\_GENERATION".  
   * Streamlit re-renders the page.  
5. **(Further Steps):**  
   * This pattern continues for test generation, test review, and final code generation.  
   * At the final step, the engine will instruct the UI to call the send\_mcp\_to\_cursor() function with the fully composed prompt, which then gets executed by the IDE.

## **5\. Data Model**

The application's data is ephemeral and lives entirely within the Streamlit session state. No database or file-based persistence is required for V1.

* **st.session\_state\['engine'\]**: This is the root of our data model. It holds the single instance of the WorkflowEngine class, which in turn manages all other application data.  
* **WorkflowEngine.\_session\_data**: This dictionary is the primary data store for a user's workflow. It will contain keys such as:  
  * user\_request (string): The initial request from the user.  
  * blueprint\_mermaid (string): The Mermaid source code for the DAAS blueprint.  
  * test\_cases (list of dicts): The structured data for the test cases, where each dict has keys: Description, Inputs, Expected Outcome.  
  * final\_mcp\_prompt (string): The final, fully-composed prompt to be sent to Cursor.  
* **WorkflowEngine.history**: A list where each element is a deep copy of the \_session\_data dictionary at a specific point in time, enabling the undo/redo functionality.

## **6\. API Contracts (Internal)**

These are not network APIs, but the key function signatures that define the boundaries between our components.

* **UI \-\> Engine Interface:**  
  \# In WorkflowEngine class  
  def handle\_action(self, action\_id: str, payload: dict \= None) \-\> None:  
      """  
      Processes a user or system action, updates the internal state,  
      and transitions to the next step.  
      \- action\_id: The action identifier from the YAML config (e.g., "SUBMIT\_REQUEST").  
      \- payload: An optional dictionary containing data from the UI (e.g., text input).  
      """  
      pass

  def get\_current\_step\_info(self) \-\> dict:  
      """  
      Returns a dictionary with metadata about the current step needed by the UI to render.  
      Example: {'type': 'ui\_prompt', 'component': 'blueprint\_editor'}  
      """  
      pass

* **Engine \-\> Communication Gateway Interface:**  
  \# In ui\_components.py  
  def send\_mcp\_to\_cursor(prompt: str) \-\> None:  
      """  
      Takes a string, formats it into the MCP protocol, and sends it to the Cursor IDE.  
      This function contains the only direct dependency on the MCP protocol itself.  
      """  
      pass

## **7\. Operational Excellence**

Since this is a local-first application, operational excellence focuses on debuggability and user feedback rather than monitoring and alarming.

* **Logging:** We will use Python's built-in logging module. Key events to log to the console with INFO level include:  
  * Engine initialization.  
  * State transitions (e.g., "State changing from REVIEW\_BLUEPRINT to START\_TEST\_GENERATION").  
  * Execution of llm\_task steps, including the prompt sent (for debugging).  
  * Final MCP command being sent to Cursor.  
* **Error Messages:** As defined in the error handling strategy, caught exceptions in the main app loop will be presented to the user via st.error(). The message will be user-friendly (e.g., "An error occurred while communicating with the AI. Please try again.") while the full traceback is logged to the console for debugging.

## **8\. Test Strategy**

Our test strategy is designed to maximize confidence in our core logic.

### **8.1. Unit Tests**

* **Framework:** pytest.  
* **Target:** The WorkflowEngine in guide\_engine.py will have comprehensive unit test coverage (\>90%).  
* **Scenarios:**  
  * Test successful parsing of a valid YAML config.  
  * Test for ConfigError on malformed YAML.  
  * For each step, test that handle\_action correctly updates the state and session data.  
  * Simulate LLM success and failure by mocking the LLM client, and test that the engine transitions to the correct on\_success or on\_failure step.  
* **Exclusions:** The UI components in wizard\_app.py and ui\_components.py will not be unit tested, as this is notoriously difficult with Streamlit. Their logic is simple enough to be covered by manual E2E testing.

### **8.2. End-to-End (E2E) Manual Testing**

* A formal test plan will be created in a QA document. It will contain a checklist of user scenarios to be executed manually in the browser before each release.  
* **Scenarios will include:**  
  * The full "Happy Path" workflow.  
  * Editing a blueprint and confirming the changes are used in the next step.  
  * Using the "Regenerate" button.  
  * Verifying that LLM errors are displayed gracefully to the user.

## **9\. Risks & Mitigation**

* **Risk 1: Protocol Drift.** The mcp-feedback-enhanced project is abandoned, or the underlying MCP protocol in Cursor changes, breaking our communication.  
  * **Mitigation:** High. We have explicitly isolated all MCP-specific logic into a single send\_mcp\_to\_cursor() function. If the protocol changes, this is the only place we need to update.  
* **Risk 2: LLM Unreliability.** The LLM may return unstructured or nonsensical data, breaking our workflow (e.g., non-Mermaid code, non-JSON test cases).  
  * **Mitigation:** Medium. Our llm\_task steps will include robust parsing and validation of the LLM's output. If validation fails, we will raise an LLMError and guide the user to retry the step, rather than propagating bad data through the system. We can also improve our prompt templates over time to be more resilient.  
* **Risk 3: Component Library Limitations.** The Streamlit components (st.data\_editor, streamlit-mermaid) may have bugs or limitations that impact our desired UX.  
  * **Mitigation:** Medium. We will perform a spike during the initial development phase to validate the core functionality of these components against our requirements. If we find critical limitations, we will raise this early and discuss alternative UI approaches.

## **10\. Out of Scope / Future Work**

This section clearly defines what we are *not* building in V1 to manage scope and stakeholder expectations.

* **Cloud-hosted version:** V1 is local-only.  
* **Persistence:** Session data is lost on page refresh.  
* **Additional Workflows:** Only the "Spec-Then-Code" workflow is supported. The engine is designed for this, but new workflows will require further design.  
* **"Guide Store":** The ability for users to discover and download new workflow YAMLs is a future vision.  
* **Intelligent Diagram Diffing:** The side-by-side comparison of diagrams in the Refine stage will be a simple visual comparison, not a semantic diff.