---
argument-hint: <command>
description: Local browser observation tool - capture console logs, network requests, and page state for debugging and AI inspection
allowed-tools: Bash, Read
---

# DevTrace Skill

## What DevTrace Does

DevTrace is a local daemon that watches your Chrome browser and records everything that happens:

- **Console output** — All logs, warnings, and errors
- **Network activity** — HTTP requests, responses, and failures
- **Page state** — URLs, titles, buttons, links, forms
- **Exceptions** — JavaScript errors with stack traces

All data is written to local files and a local HTTP API, making it perfect for:
- Debugging web applications
- AI agents inspecting browser state
- Understanding what happened in a test or interaction
- Recording browser sessions for analysis

## When to Use DevTrace

Use `/devtrace` when you need to:

✅ **Capture browser behavior** for later analysis
✅ **Debug web app issues** by seeing what's happening in the browser
✅ **Let AI agents inspect** what happened during a test
✅ **Record browser sessions** to understand user interactions
✅ **Monitor network activity** while testing a web app
✅ **Capture console errors** from a real browser session

## How to Use

### Start Observing

```bash
/devtrace start
```

This will:
1. Launch Chrome (or connect to existing Chrome instance)
2. Create a timestamped session directory in `./sessions/`
3. Start a local API on `http://localhost:3333`
4. Begin capturing all browser activity

Then navigate to any website in Chrome. Everything is recorded automatically.

Press `Ctrl+C` to stop.

### View Results

While DevTrace is running:

```bash
# In another terminal
/devtrace inspect
```

Or query specific data:

```bash
/devtrace console          # Show recent console messages
/devtrace network          # Show recent network requests
/devtrace api              # Get full session state as JSON
```

### Session Data

Sessions are stored in `./sessions/latest/`:

- `current-state.json` — AI-readable summary (JSON)
- `console.jsonl` — Raw console events (one per line)
- `network.jsonl` — Raw network events (one per line)
- `errors.jsonl` — JavaScript errors
- `events.jsonl` — All events combined

## Commands Reference

| Command | Purpose |
|---------|---------|
| `/devtrace start` | Launch Chrome and start observing |
| `/devtrace stop` | Stop the current session |
| `/devtrace inspect` | View session summary |
| `/devtrace console` | Show console messages from latest session |
| `/devtrace network` | Show network requests from latest session |
| `/devtrace api` | Query the local API for full session data |
| `/devtrace status` | Check if DevTrace is running |
| `/devtrace files` | Show the files in the latest session |

## Real-World Examples

### Example 1: Debug a Web App

```bash
# Start observing
/devtrace start

# (In Chrome, navigate to your app and trigger some behavior)
# (Open the console, interact with the page, etc.)

# In another terminal, inspect what happened
/devtrace inspect

# Look at the console output
/devtrace console

# Check network requests
/devtrace network
```

### Example 2: Let an AI Agent Inspect Browser State

```bash
# Start observing
/devtrace start

# (Run some tests or interactions in Chrome)

# Query the API to get structured data
curl http://localhost:3333/latest | jq .

# Agent can now:
# - See what console errors occurred
# - Check if network requests succeeded
# - Understand the page state (buttons, forms, links)
# - Read the full event history
```

### Example 3: Capture Console Errors

```bash
# Start observing
/devtrace start

# (In Chrome console, run some code that causes errors)
# (Or trigger errors through user interactions)

# Stop and check results
/devtrace inspect

# View all errors
cat sessions/latest/errors.jsonl | jq .
```

## Session Structure

Each session is timestamped and stored in `./sessions/`:

```
sessions/
  2026-06-19-15-30-00/
    current-state.json           # AI-readable JSON summary
    console.jsonl                # Console events (JSONL)
    network.jsonl                # Network events (JSONL)
    errors.jsonl                 # Error events (JSONL)
    events.jsonl                 # All events combined
  latest/                         # Symlink to most recent
```

### current-state.json Format

```json
{
  "sessionId": "2026-06-19-15-30-00",
  "activeUrl": "https://example.com/dashboard",
  "title": "Dashboard",
  "lastNavigation": "2026-06-19T15:30:00.000Z",
  "summary": {
    "consoleErrors": 2,
    "consoleWarnings": 4,
    "failedRequests": 1,
    "lastError": "Cannot read properties of undefined"
  },
  "console": [
    {"level": "log", "text": "Page loaded", "timestamp": "..."},
    {"level": "error", "text": "Error occurred", "timestamp": "..."}
  ],
  "network": [
    {"url": "https://api.example.com/data", "method": "GET", "status": 200, "timestamp": "..."}
  ],
  "errors": [...],
  "pageSnapshot": {
    "title": "Dashboard",
    "text": "...",
    "buttons": [...],
    "links": [...],
    "forms": [...]
  }
}
```

## Setup (One-Time)

If you haven't set up DevTrace yet:

```bash
cd /Users/dustin/projects/devtrace
npm install
npm install -g .
```

Then verify it works:

```bash
devtrace help
```

## Local API Reference

While DevTrace is running, the local API is available at `http://localhost:3333`:

```bash
# Full session state
curl http://localhost:3333/latest | jq .

# Console messages only
curl http://localhost:3333/latest/console | jq .

# Network requests only
curl http://localhost:3333/latest/network | jq .

# JavaScript errors
curl http://localhost:3333/latest/errors | jq .

# Page snapshot
curl http://localhost:3333/latest/page | jq .

# Health check
curl http://localhost:3333/health | jq .
```

## How AI Agents Use DevTrace

Agents can:

1. **Trigger behavior** in a website
2. **Query `/latest`** endpoint to see what happened
3. **Analyze console errors** to understand issues
4. **Check network requests** to verify API calls
5. **Read page snapshot** to understand UI state
6. **Use events.jsonl** to see detailed event history

Example agent workflow:

```
1. Start DevTrace: devtrace start
2. Trigger test: navigate to website, click buttons, etc.
3. Query state: curl http://localhost:3333/latest
4. Analyze data: look at summary, console errors, network requests
5. Determine next action based on results
6. Repeat until test complete
7. Review full session: cat sessions/latest/current-state.json
```

## Troubleshooting

**Chrome won't launch?**
- Make sure Chrome is installed: `which google-chrome` or `which chromium`
- Try running with: `devtrace start --debug`

**No data captured?**
- Make sure you navigate to a website in Chrome (not just blank page)
- Check that Chrome has the DevTools port open: `lsof -i :9222`
- Check the session files: `ls -la sessions/latest/`

**API not responding?**
- Verify DevTrace is running: `lsof -i :3333`
- Check port isn't in use: `lsof -i :3333`

**Files not being written?**
- Check write permissions: `ls -la sessions/`
- Make sure disk has space: `df -h`

## Project Location

- **Code:** `/Users/dustin/projects/devtrace`
- **Sessions:** `/Users/dustin/projects/devtrace/sessions/`
- **Documentation:** `/Users/dustin/projects/devtrace/README.md`

## For More Information

- Full documentation: `cat /Users/dustin/projects/devtrace/README.md`
- Quick start guide: `cat /Users/dustin/projects/devtrace/QUICKSTART.md`
- Implementation details: `cat /Users/dustin/projects/devtrace/IMPLEMENTATION.md`

---

## Quick Decision Tree

**"Should I use DevTrace?"**

- Is it a browser-related issue? → YES
  - Do I need to see what happened? → YES
    - Console output? → `/devtrace start` then check console.jsonl
    - Network requests? → `/devtrace start` then check network.jsonl
    - Full page state? → `/devtrace start` then check current-state.json
  - Do I need an AI to inspect it? → YES
    - Query the API → `/devtrace start` then use http://localhost:3333/latest
- Is it a non-browser issue? → NO → Use regular debugging tools

**"What command should I run?"**

- Starting fresh → `/devtrace start`
- Check results → `/devtrace inspect`
- See specific data → `/devtrace console` or `/devtrace network`
- Get structured data → `/devtrace api` or `curl http://localhost:3333/latest`
