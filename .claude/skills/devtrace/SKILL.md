---
name: devtrace
argument-hint: <command>
description: Local browser observation tool - capture console logs, network requests, and page state for debugging and AI inspection
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

## Invoking DevTrace

When you run `/devtrace`, you're loading this skill. The skill then:
1. **Checks if DevTrace is already running** — If not, it'll suggest starting it
2. **Detects your project type** — Suggests the most relevant things to monitor (e.g., extension console for Chrome extensions, Laravel logs for web apps)
3. **Guides you through the workflow** — Start → interact with your app → inspect results

## Getting Started (Quickest Path)

The typical workflow is **three steps**:

### Step 1: Check Status and Start

```bash
/devtrace status
```

If not running, start it:

```bash
/devtrace start
```

This will:
- Launch Chrome (or connect to existing instance)
- Create a timestamped session directory in `./sessions/`
- Start a local API on `http://localhost:3333`
- Begin capturing all browser activity (console, network, page state, errors)

### Step 2: Trigger Your Behavior

In Chrome, navigate to your app and interact with it:
- Load a page
- Click buttons or interact with features
- Check the console for errors
- Let network requests complete

Everything is being recorded automatically.

### Step 3: Inspect When Needed

When you want to see what happened, run:

```bash
/devtrace inspect
```

This shows a summary. For **specific details only when needed**:

```bash
/devtrace console          # Only if you need to see console logs/errors
/devtrace network          # Only if you need to check HTTP requests
```

**Stop recording when done:**

```bash
/devtrace stop
```

### Session Data

Sessions are stored in `./sessions/latest/`:

- `current-state.json` — AI-readable summary (JSON)
- `console.jsonl` — Raw console events (one per line)
- `network.jsonl` — Raw network events (one per line)
- `errors.jsonl` — JavaScript errors
- `events.jsonl` — All events combined

## Commands Reference

### Primary Workflow (Most Common)

| Command | Purpose |
|---------|---------|
| `/devtrace status` | Check if DevTrace is running (run this first) |
| `/devtrace start` | Launch Chrome and begin recording all browser activity |
| `/devtrace inspect` | View summary of the latest session (run after interacting with your app) |
| `/devtrace stop` | Stop recording and close the session |

### Secondary Tools (Use Only When Needed)

| Command | Purpose |
|---------|---------|
| `/devtrace console` | Show console messages/errors from latest session (only if you need to inspect logs) |
| `/devtrace network` | Show network requests from latest session (only if you need to check API calls) |
| `/devtrace api` | Query the local API for full structured data as JSON |
| `/devtrace files` | Show the files in the latest session directory |

## Real-World Examples

### Example 1: Quick Browser Debugging (Typical Workflow)

```bash
# 1. Check status and start recording
/devtrace status
/devtrace start

# 2. (In Chrome) Navigate to your app and trigger the behavior
#    - Load a page
#    - Click buttons
#    - Interact with features
#    - Let requests complete

# 3. See what happened
/devtrace inspect

# 4. If needed, dig into specifics
/devtrace console    # Only if looking for console errors
/devtrace network    # Only if checking HTTP requests

# 5. Stop when done
/devtrace stop
```

### Example 2: Chrome Extension Debugging

For Chrome extension development (like google-maps-content.js), DevTrace captures:
- Extension console logs and errors
- Content script execution
- Background script messages
- Network requests from the extension

```bash
/devtrace start

# (In Chrome) Navigate to a page and trigger your extension
# Check the extension popup, content script behavior, etc.

/devtrace inspect      # See overall session
/devtrace console      # Check for extension errors
```

### Example 3: AI-Driven Session Inspection

When Claude Code needs to analyze what happened:

```bash
/devtrace start

# (Trigger behavior in Chrome)

# Query the structured API
curl http://localhost:3333/latest | jq .

# Claude Code can now:
# - Analyze console errors
# - Check if network requests succeeded
# - Understand page structure and state
# - Review full event history
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

## The Recommended Workflow

When you invoke `/devtrace`:

1. **First**: Run `/devtrace status` to check if it's already running
2. **If not running**: Run `/devtrace start` to launch Chrome and begin recording
3. **Then**: Go to Chrome and interact with your app (navigate, click, trigger behavior)
4. **When done**: Run `/devtrace inspect` to see what was captured
5. **Only if needed**: 
   - Run `/devtrace console` to check logs/errors
   - Run `/devtrace network` to check HTTP requests
6. **Finally**: Run `/devtrace stop` to stop recording

## When Should I Check Console/Network?

- **Console** — Only if you saw errors in the browser or want to verify specific log messages
- **Network** — Only if you need to verify API calls, request payloads, or response status codes
- **Inspector** — Usually enough; gives you the summary automatically

## Project-Specific Guidance

**For this project (Papertrail with Chrome extension):**
- Start DevTrace and navigate to pages where your extension is active
- Most issues will show up in the console (extension errors, content script logs)
- Check network if debugging API requests from your extension
- The `inspect` command gives you the full picture without needing to dive into logs
