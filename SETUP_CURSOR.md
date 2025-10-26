# Setting Up The Wizard MCP in Cursor

This guide helps you set up **The Wizard MCP** in Cursor alongside your existing `mcp-feedback-enhanced` installation.

## Why We Need This Setup

You already have the original `mcp-feedback-enhanced` installed in Cursor. Our project is an enhanced version that adds **The Wizard** functionality, so we need to:

1. **Avoid naming conflicts** - Use different server name and port
2. **Run from local development** - Use your local code instead of published package
3. **Configure MCP properly** - Add to Cursor's MCP configuration

## Step 1: Install Dependencies

```bash
cd /Users/yilunqian/Documents/GitHub/the-wizard-mcp

# Install dependencies using uv (recommended)
uv sync

# OR using pip
pip install -e .
```

## Step 2: Test Local Server

First, verify the server works locally:

```bash
# Set debug mode
export MCP_DEBUG=true

# Start the server
uv run python -m mcp_feedback_enhanced.server
```

You should see:

```
🚀 啟動互動式回饋收集 MCP 服務器
   服務器名稱: The Wizard MCP - 互動式回饋收集與引導式開發
   版本: 2.6.0
   ...
   等待來自 AI 助手的調用...
```

Press `Ctrl+C` to stop the server.

## Step 3: Update Cursor MCP Configuration

### Option A: Add to Existing Configuration

Open your Cursor MCP config file:

```bash
open ~/.cursor/mcp.json
```

Add this entry to the `mcpServers` section (alongside your existing servers):

```json
{
  "mcpServers": {
    // ... your existing servers ...
    "the-wizard-mcp": {
      "command": "uv",
      "args": [
        "--directory",
        "/Users/yilunqian/Documents/GitHub/the-wizard-mcp",
        "run",
        "python",
        "-m",
        "mcp_feedback_enhanced.server"
      ],
      "timeout": 600,
      "env": {
        "MCP_DEBUG": "true",
        "MCP_WEB_HOST": "127.0.0.1",
        "MCP_WEB_PORT": "8766"
      },
      "autoApprove": [
        "interactive_feedback",
        "wizard_start"
      ]
    }
  }
}
```

**Important Notes**:

- Uses port `8766` (different from your existing `8765`)
- Server name is `the-wizard-mcp` (different from `mcp-feedback-enhanced`)
- Points to your local development directory
- Includes `wizard_start` in autoApprove

### Option B: Use Our Template

Alternatively, you can copy our template:

```bash
# Copy our template to a backup location
cp /Users/yilunqian/Documents/GitHub/the-wizard-mcp/examples/cursor-mcp-config.json ~/.cursor/mcp-wizard-backup.json

# Then manually merge with your existing ~/.cursor/mcp.json
```

## Step 4: Restart Cursor

After updating the MCP configuration:

1. **Quit Cursor completely** (Cmd+Q on Mac)
2. **Restart Cursor**
3. **Wait for MCP servers to initialize** (check status bar)

## Step 5: Verify Installation

### Check MCP Server Status

In Cursor, you should see both servers in the MCP status:

- ✅ `mcp-feedback-enhanced` (your original)
- ✅ `the-wizard-mcp` (our new one)

### Test Available Tools

Ask Cursor AI:

```
Can you list all available MCP tools?
```

You should see:

- `interactive_feedback` (from both servers - that's OK)
- `wizard_start` (from the-wizard-mcp only)
- `get_system_info` (from both servers)

## Step 6: Test The Wizard

Now you can test The Wizard! Ask Cursor AI:

```
Use wizard_start to help me design a user login feature.
Generate a Mermaid sequence diagram showing the authentication flow.
```

**Expected behavior**:

1. Cursor AI generates a Mermaid diagram
2. Calls `wizard_start` tool with the diagram
3. Browser opens at `http://localhost:8766/wizard`
4. You see The Wizard UI with the diagram

## Troubleshooting

### Issue: "No wizard_start tool available"

**Solution**:

1. Check that `the-wizard-mcp` server is running in Cursor's MCP status
2. Restart Cursor
3. Verify the MCP configuration path is correct

### Issue: "Connection refused" or server won't start

**Solution**:

1. Check that `uv` is installed: `uv --version`
2. Verify the directory path in MCP config
3. Try running the server manually first (Step 2)

### Issue: Port conflict (8766 already in use)

**Solution**: Change the port in MCP config:

```json
"env": {
  "MCP_WEB_PORT": "8767"  // Use different port
}
```

### Issue: Both servers have interactive_feedback

This is normal and OK. Cursor will use one of them (usually the first one loaded).

## Configuration Summary

After setup, you'll have:

| Server                    | Port | Tools                                                           | Purpose                      |
| ------------------------- | ---- | --------------------------------------------------------------- | ---------------------------- |
| `mcp-feedback-enhanced` | 8765 | `interactive_feedback`, `get_system_info`                   | Original feedback collection |
| `the-wizard-mcp`        | 8766 | `interactive_feedback`, `wizard_start`, `get_system_info` | Enhanced with The Wizard     |

## Development Workflow

For development, you can:

1. **Edit code** in `/Users/yilunqian/Documents/GitHub/the-wizard-mcp`
2. **Restart MCP server** in Cursor (or restart Cursor)
3. **Test changes** by calling `wizard_start`

The server runs from your local code, so changes are reflected immediately after restart.

## Next Steps

Once setup is complete:

1. **Test The Wizard** with the example above
2. **Follow the manual testing guide**: `docs/wizard/manual-testing-guide.md`
3. **Report any issues** you encounter

---

**Ready to use The Wizard! 🧙✨**
