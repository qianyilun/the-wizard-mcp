# The Wizard - Manual Testing Guide

This guide walks you through manually testing The Wizard UI to verify Phase 1 functionality.

## Prerequisites

1. **MCP Server Running**: The `mcp-feedback-enhanced` server must be running
2. **Cursor with MCP**: Cursor should be configured to use the MCP server
3. **Python Environment**: All dependencies installed (`uv sync` or `pip install -e .`)

## Test Environment Setup

### Step 1: Start the MCP Server

```bash
# From project root
cd /Users/yilunqian/Documents/GitHub/the-wizard-mcp

# Set debug mode for detailed logs
export MCP_DEBUG=true

# Start the server
python -m mcp_feedback_enhanced.server
```

The server should start and display:
```
🚀 啟動互動式回饋收集 MCP 服務器
   服務器名稱: 互動式回饋收集 MCP
   ...
   等待來自 AI 助手的調用...
```

### Step 2: Verify MCP Tool Registration

In Cursor, open a Python file and use the AI. You can check that the `wizard_start` tool is available:

Ask Cursor AI: "Can you list available MCP tools?"

You should see `wizard_start` in the list.

## Manual Test Cases

### Test Case 1: Launch Wizard with AI-Generated Blueprint

**Objective**: Test the complete flow from MCP tool call to UI display.

#### Steps:

1. **Trigger wizard_start from Cursor**:

   Ask Cursor AI:
   ```
   Use the wizard_start tool to help me plan a user login feature.
   Generate a Mermaid sequence diagram for the authentication flow.
   ```

2. **Expected: Cursor AI should**:
   - Generate a Mermaid diagram
   - Call `wizard_start` tool with:
     ```python
     wizard_start(
         project_directory=".",
         stage="plan",
         ai_generated_content="<Mermaid diagram here>",
         user_context="Plan user login feature"
     )
     ```

3. **Expected: MCP Server Response**:
   ```
   🧙 The Wizard UI has been launched!

   Session ID: <uuid>
   Current Stage: plan
   Project: /path/to/project

   🌐 Open in browser: http://localhost:8765/wizard
   ```

4. **Browser Opens Automatically**: The wizard UI should open in your default browser

5. **Verify UI Elements**:
   - ✅ Header shows "🧙 The Wizard" title
   - ✅ Stage progress bar shows 6 stages (Context, Mode, Blueprint, Tests, Code, Review)
   - ✅ "Blueprint" stage is highlighted as active
   - ✅ Left pane shows "📝 Mermaid Source" with editable textarea
   - ✅ Right pane shows "👁️ Preview" with rendered diagram
   - ✅ Bottom shows connection status (green dot + "Connected")
   - ✅ "Confirm Blueprint →" button is visible and enabled

### Test Case 2: Edit Blueprint in Real-Time

**Objective**: Verify Mermaid editor functionality and live preview.

#### Steps:

1. **Edit the Mermaid source** in the left pane:
   - Modify some node labels
   - Add a new connection
   - Example edit:
     ```mermaid
     graph TD
         A[User Login Request] --> B{Validate Credentials}
         B -->|Valid| C[Create Session]
         B -->|Invalid| D[Return Error]
         C --> E[Return Success Token]
         D --> F[Log Failed Attempt]
     ```

2. **Wait 500ms** (debounce delay)

3. **Expected**:
   - ✅ Right pane updates automatically with new diagram
   - ✅ No errors shown
   - ✅ "Confirm Blueprint" button remains enabled

4. **Test Invalid Syntax**:
   - Delete a line to make invalid Mermaid
   - Expected: Red error box appears in preview pane
   - Expected: "Confirm Blueprint" button becomes disabled

5. **Fix the syntax**:
   - Restore valid Mermaid code
   - Expected: Preview renders successfully again

### Test Case 3: Confirm Blueprint and Stage Transition

**Objective**: Test blueprint confirmation and progression to next stage.

#### Steps:

1. **Click "Confirm Blueprint →" button**

2. **Expected**:
   - ✅ Button text changes to "Confirming..." temporarily
   - ✅ Button becomes disabled
   - ✅ Progress bar updates: "Blueprint" stage marked as completed (green checkmark)
   - ✅ "Tests" stage becomes active
   - ✅ Main content area changes to show "Test Cases Review" heading

3. **Check Browser Console** (F12 → Console):
   - Should show: `[WIZARD] Sent message: confirm_blueprint`
   - Should show: `[WIZARD] Received message: blueprint_confirmed`

4. **Check Server Logs**:
   - Should show: `[WIZARD] Blueprint confirmed for session <id>`
   - Should show: `[WIZARD] Session <id> transitioned: REVIEW_BLUEPRINT → REVIEW_TEST_MATRIX`

### Test Case 4: WebSocket Connection and Heartbeat

**Objective**: Verify WebSocket connection stability.

#### Steps:

1. **Keep the wizard UI open for 60+ seconds**

2. **Verify**:
   - ✅ Connection status remains "Connected" with green dot
   - ✅ No disconnection errors

3. **Check Browser Console**:
   - Should periodically see (every 30 seconds):
     ```
     [WIZARD] Sent message: heartbeat
     [WIZARD] Received message: heartbeat_ack
     ```

4. **Test Reconnection**:
   - Stop the MCP server (`Ctrl+C`)
   - Expected: Status changes to "Disconnected" with red dot
   - Expected: "Reconnecting... (1/5)" message appears
   - Restart server
   - Expected: Status returns to "Connected" automatically

### Test Case 5: Multiple Browser Tabs

**Objective**: Verify session sharing across tabs.

#### Steps:

1. **With wizard UI open, copy the URL**
   - Example: `http://localhost:8765/wizard`

2. **Open the same URL in a new tab**

3. **Expected**:
   - ✅ Second tab connects to same session
   - ✅ Both tabs show same blueprint content
   - ✅ Edit in one tab updates the other (after refresh)

4. **Close one tab**:
   - ✅ Other tab continues working normally

### Test Case 6: Session Persistence

**Objective**: Test session data persistence during UI reload.

#### Steps:

1. **Edit the blueprint** to add some custom content

2. **Refresh the browser page** (F5 or Cmd+R)

3. **Expected**:
   - ✅ Page reloads
   - ✅ Reconnects to WebSocket
   - ✅ **Note**: Current blueprint content may be lost (expected in Phase 1)
   - ✅ Session ID remains the same

### Test Case 7: Back Button Functionality

**Objective**: Test backward navigation (placeholder in Phase 1).

#### Steps:

1. **Click "← Back" button** at the bottom

2. **Expected**:
   - Message sent to server requesting rollback
   - May show notification or no action in Phase 1 (full implementation in Phase 3)

## Debugging Tips

### Check Server Logs

With `MCP_DEBUG=true`, you should see detailed logs:

```
[WIZARD] wizard_start called - stage: plan
[WIZARD] Launching wizard UI for stage: plan
[WIZARD] Created session <id> (routine: RIPER-5)
[WIZARD] Wizard UI launched at http://localhost:8765/wizard
[WIZARD] WebSocket connection accepted
[WIZARD] WebSocket connected to session <id>
[WIZARD] Received message: heartbeat
[WIZARD] Handling message type: confirm_blueprint
[WIZARD] Blueprint confirmed for session <id>
```

### Check Browser Console

Press F12 and go to Console tab. You should see:

```javascript
[WIZARD] Initializing Wizard App...
[WIZARD] Connecting to WebSocket: ws://localhost:8765/ws/wizard
[WIZARD] WebSocket connected
[WIZARD] Received message: session_info {...}
[WIZARD] Mermaid diagram rendered successfully
[WIZARD] Sent message: confirm_blueprint
```

### Common Issues

#### Issue: Browser doesn't open automatically

**Solution**: Manually navigate to `http://localhost:8765/wizard`

#### Issue: "No active wizard session" error

**Solution**:
1. Ensure you called `wizard_start` MCP tool first
2. Check server logs for session creation
3. Restart server and retry

#### Issue: WebSocket connection fails

**Solution**:
1. Check firewall settings
2. Verify port 8765 is not blocked
3. Try different port: `export MCP_WEB_PORT=9000`

#### Issue: Mermaid diagram doesn't render

**Solution**:
1. Check browser console for JavaScript errors
2. Verify mermaid.js loaded (check Network tab in DevTools)
3. Try a simpler diagram to test basic functionality

#### Issue: Changes not reflected in UI

**Solution**:
1. Check WebSocket connection status (green dot)
2. Verify server is running
3. Check browser console for errors
4. Try refreshing the page

## Success Criteria for Phase 1

✅ **Core Functionality**:
- [x] MCP tool `wizard_start` can be called from Cursor
- [x] AI-generated Mermaid diagram is received and displayed
- [x] User can edit diagram in real-time
- [x] Live preview updates as user types
- [x] Invalid syntax shows error, valid syntax renders correctly
- [x] Confirm button enables/disables based on diagram validity
- [x] Blueprint confirmation triggers stage transition
- [x] WebSocket connection is stable
- [x] Heartbeat keeps session alive

✅ **UI/UX**:
- [x] Professional, polished interface
- [x] Clear stage progress indicator
- [x] Responsive dual-pane layout
- [x] Connection status visible
- [x] Smooth transitions and feedback

✅ **Technical**:
- [x] No JavaScript errors in console
- [x] No Python exceptions in server logs
- [x] WebSocket reconnection works
- [x] Session management functional
- [x] Unit tests pass
- [x] Integration tests pass

## Next Steps After Phase 1

After validating Phase 1, you can proceed to:

- **Phase 2**: Implement Execute stage (tests and code generation)
- **Phase 3**: Implement Refine stage and rollback functionality
- **Phase 4**: Add Read and Insight stages
- **Phase 5**: Polish and production readiness

## Feedback and Issues

If you encounter any issues during manual testing:

1. **Capture logs**: Save both server logs and browser console output
2. **Document steps**: Note exact steps to reproduce
3. **Screenshots**: Capture UI state when issue occurs
4. **Report**: Create an issue with all details

---

**Happy Testing! 🧙✨**
