### **EPIC-2: User Interface & Experience (UI/UX)**

*Description: Implement the Streamlit-based user interface, including the main application loop and all custom interactive components required by the PRD.*

**TASK-4 (User Story):** As a developer, I want a main application shell that renders the correct UI component based on the engine's state, so I can interact with the workflow. (5 SP)

* **Sub-task 4.1:** Implement the main application loop in `wizard_app.py`, including the logic to initialize and persist the `WorkflowEngine` in `st.session_state`.
* **Sub-task 4.2:** Create the `match/case` or `if/elif` structure to call different UI rendering functions based on `engine.get_current_step_info()`.
* **Sub-task 4.3:** Implement the top-level `try...except` block to catch errors from the engine and display them using `st.error()`.

**TASK-5 (User Story):** As a developer, I want to see and edit the Mermaid diagram of the blueprint so that I can verify and correct the AI's plan. (8 SP)

* **Sub-task 5.1:** Create the `display_blueprint_editor` function in `ui_components.py`.
* **Sub-task 5.2:** Integrate the `streamlit-mermaid` component to render the diagram.
* **Sub-task 5.3:** Implement the two-column layout with `st.text_area` for the source code and connect its `on_change` callback to update the engine's session data.
* **Sub-task 5.4:** Implement the logic to render action buttons (e.g., "Confirm") based on the YAML config.

**TASK-6 (User Story):** As a developer, I want to review and edit the generated test cases in a table, so that I can ensure the AI understands the acceptance criteria before writing code. (5 SP)

* **Sub-task 6.1:** Create the `display_test_table` function in `ui_components.py`.
* **Sub-task 6.2:** Integrate the `st.data_editor` component, binding it to the `test_cases` data in the engine's session.
* **Sub-task 6.3:** Configure the data editor to allow for cell modification and row deletion as per the design doc.
