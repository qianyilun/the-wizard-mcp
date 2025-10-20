### **EPIC-3: IDE & LLM Integration**

*Description: Connect the application to external services: the Large Language Model for generation tasks and the Cursor IDE for final code execution.*

**TASK-7 (User Story):** As an SDE, I want the `WorkflowEngine` to be able to execute `llm_task` steps by calling an LLM client, so that it can generate artifacts like blueprints and test cases. (5 SP)

* **Sub-task 7.1:** Create a simple, mockable LLM client class/module.
* **Sub-task 7.2:** Implement the logic within the main app loop to identify `llm_task` steps and display a spinner (`st.spinner`).
* **Sub-task 7.3:** Implement the prompt templating logic (using Jinja2 or f-strings) to populate prompts with data from `_session_data`.
* **Sub-task 7.4:** Implement the logic to parse the LLM's response and save it to `_session_data` using the `output_key` from the YAML config.

**TASK-8 (User Story):** As a developer, I want the application to send the final generated code prompt to my Cursor IDE, so that the code is automatically inserted into my active file. (3 SP)

* **Sub-task 8.1:** Implement the `send_mcp_to_cursor()` gateway function in `ui_components.py`.
* **Sub-task 8.2:** Research and implement the specific MCP command format expected by Cursor based on the `mcp-feedback-enhanced` reference.
* **Sub-task 8.3:** Connect the final step of the YAML workflow to a step that triggers this gateway function.

---

### **EPIC-4: Testing & Quality Assurance**

*Description: Ensure the application is robust, reliable, and meets quality standards through comprehensive testing.*

**TASK-9 (User Story):** As an SDE, I want comprehensive unit tests for the `WorkflowEngine`, so that I can refactor and extend the core logic with confidence. (8 SP)

* **Sub-task 9.1:** Set up the `pytest` framework and testing environment.
* **Sub-task 9.2:** Write unit tests for the YAML parsing and config validation logic.
* **Sub-task 9.3:** Write unit tests for every possible state transition defined in the V1 YAML file.
* **Sub-task 9.4:** Write unit tests for the error handling logic, ensuring custom exceptions are raised correctly.
* **Sub-task 9.5:** Mock the LLM client and test the `llm_task` execution logic.

**TASK-10 (User Story):** As a team, we need a documented manual test plan, so that we can perform consistent E2E testing before release. (3 SP)

* **Sub-task 10.1:** Create a QA document (e.g., in Confluence or a `TESTING.md` file).
* **Sub-task 10.2:** Document the step-by-step test case for the "Happy Path."
* **Sub-task 10.3:** Document test cases for key error conditions and edge cases (e.g., editing a blueprint, regenerating a response).
