---
name: devtrace
argument-hint: <command>
description: Local browser observation tool - capture console logs, network requests, and page state for debugging and AI inspection
---

# DevTrace Skill

## What DevTrace Does

DevTrace is a local browser recorder that gives an AI agent **eyes into what you're doing on the page**.

When you click around, submit forms, or navigate:
- **I see what you did** — navigation, clicks, form submissions, search queries
- **I see what happened** — errors, network calls, page changes, console output
- **I see the connection** — which action caused which error or result

DevTrace captures:
- **Your actions** (clicks, navigation, forms)
- **Page metadata** (titles, search queries, content)
- **Browser events** (console, network, errors)
- **The timeline** (what happened when)

## The Simple Workflow

```
devtrace start          ← Start recording your browser
[You click around]      ← AI watches what you're doing
devtrace stop           ← Stop recording
"What happened?"        ← Ask the AI
AI: "You clicked X,     ← AI explains the causation chain
which triggered Y,      
which failed with Z"
```

## Why This Matters

**For debugging:** Instead of describing "something broke", the AI can see exactly what you did and what went wrong.

**For testing:** The AI can verify that your changes actually work by recording a session and analyzing the results.

**For understanding:** The AI can show you the complete picture—not just errors, but what actions led to those errors.

**For speed:** No back-and-forth questions. The AI sees the data and understands what happened.

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
- Create a timestamped session in `~/.devtrace/sessions/`
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
devtrace inspect
```

This shows a summary. For **real-time logs while running**:

```bash
devtrace tail                      # Stream all events (console + network)
devtrace tail console              # Stream console logs only
devtrace tail network              # Stream network requests only
```

**Stop recording when done:**

```bash
devtrace stop
```

### Session Data

Sessions are stored in `~/.devtrace/sessions/` on your machine (accessible from any project):

**Summary:**
- `current-state.json` — Session metadata and summary (JSON)

**User Actions & Page State:**
- `actions.jsonl` — Your actions (navigation, clicks, forms)
- `metadata.jsonl` — Page metadata (titles, URLs, search queries)

**Browser Events:**
- `console.jsonl` — Console logs, warnings, errors
- `network.jsonl` — Network requests and responses
- `errors.jsonl` — JavaScript exceptions

**Combined:**
- `events.jsonl` — All events merged chronologically

## Commands Reference

### Primary Workflow (Most Common)

| Command | Purpose |
|---------|---------|
| `devtrace start` | Launch Chrome and begin recording all browser activity |
| `devtrace inspect` | View summary of the latest session (run after interacting with your app) |
| `devtrace stop` | Stop recording and close the session |
| `devtrace open` | Open the latest session in your default browser |

### Secondary Tools (Use Only When Needed)

| Command | Purpose |
|---------|---------|
| `devtrace tail [console\|network]` | Stream logs in real-time (both if no arg specified) |
| `devtrace setup` | Configure DevTrace with interactive walkthrough |
| `devtrace skill` | Install or check Claude skill status |

### Getting Help

For any command, use the `-h` flag to see detailed help:

```bash
devtrace -h                        # Show all available commands
devtrace start -h                  # Show detailed help for start command
devtrace tail -h                   # Show detailed help for tail command
devtrace inspect -h                # Show detailed help for inspect command
devtrace open -h                   # Show detailed help for open command
devtrace stop -h                   # Show detailed help for stop command
devtrace setup -h                  # Show detailed help for setup command
devtrace skill -h                  # Show detailed help for skill command
```

Each command's help includes:
- Detailed description of what it does
- Usage syntax with all available options
- Real-world examples

## Real-World Examples

### Example 1: Quick Browser Debugging (Typical Workflow)

```bash
# 1. Start recording
devtrace start

# 2. (In Chrome) Navigate to your app and trigger the behavior
#    - Load a page
#    - Click buttons
#    - Interact with features
#    - Let requests complete

# 3. See what happened
devtrace inspect

# 4. Stream logs if needed
devtrace tail                      # Stream all events (console + network)
devtrace tail console              # Stream console logs only
devtrace tail network              # Stream network requests only

# 5. Open session in browser for full details
devtrace open

# 6. Stop when done
devtrace stop

# Need help with any command?
devtrace start -h        # Get detailed help for start command
```

### Example 2: Chrome Extension Debugging

For Chrome extension development (like google-maps-content.js), DevTrace captures:
- Extension console logs and errors
- Content script execution
- Background script messages
- Network requests from the extension

```bash
devtrace start --new

# (In Chrome) Navigate to a page and trigger your extension
# Check the extension popup, content script behavior, etc.

devtrace inspect               # See overall session
devtrace tail                  # Stream all events (console + network)
devtrace tail console          # Stream console errors from extension only
devtrace open                  # View full session in browser
devtrace stop                  # Stop when done

# Need help with options?
devtrace start -h              # See all start command options
```

### Example 3: AI-Driven Session Inspection

When Claude Code needs to analyze what happened:

```bash
devtrace start

# (Trigger behavior in Chrome)

# Query the structured API
curl http://localhost:3333/latest | jq .

# Claude Code can now:
# - Analyze console errors
# - Check if network requests succeeded
# - Understand page structure and state
# - Review full event history

# Stream logs in real-time if debugging
devtrace tail console
devtrace tail network

# Get help on any step
devtrace inspect -h             # See inspection options
devtrace tail -h                # See tail command options
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

## How I Use DevTrace as Your AI Assistant

When you ask me to fix a bug, build a feature, or debug an issue:

1. **I start DevTrace** to begin recording (`devtrace start`)
2. **I trigger the behavior** — navigate to pages, interact with your app, reproduce the issue
3. **I immediately query the API** — `curl http://localhost:3333/latest` to get structured data
4. **I analyze what actually happened**:
   - Console errors? I see the exact stack traces
   - Network failures? I see which requests failed and why
   - Page broken? I see the rendered state
   - Unexpected behavior? I see the exact sequence of events
5. **I make decisions based on real data** — not guesses
6. **I verify my fixes work** by running them, capturing with DevTrace, and confirming no errors occurred
7. **I tell you confidently** if something works — because I've *seen* it work

### Real Example: Debugging a Feature

Instead of:
- You: "The button isn't working"
- Me: "Can you describe what happened?"
- You: (describes it)
- Me: (makes a guess and you test it)

With DevTrace:
- You: "The button isn't working"
- Me: (start DevTrace, click button, inspect immediately)
- Me: "I see the issue — the API returned a 404. Here's the fix."
- Me: (test the fix, verify no errors with DevTrace)
- Me: (you get a confident solution, not a guess)

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

When you use DevTrace:

1. **Start recording**: Run `devtrace start` to launch Chrome and begin recording
2. **Interact with your app**: In Chrome, navigate, click, and trigger the behavior you want to debug
3. **Inspect the session**: Run `devtrace inspect` to see what was captured
4. **Dig deeper if needed**: 
   - Run `devtrace tail console` to stream console logs/errors
   - Run `devtrace tail network` to stream network requests
   - Run `devtrace open` to view the full session in your browser
5. **Stop recording**: Run `devtrace stop` to stop recording
6. **Get help anytime**: Use `-h` flag on any command (e.g., `devtrace start -h`) for detailed help

## When Should I Check Console/Network?

- **Console** — Run `devtrace tail console` only if you saw errors in the browser or want to verify specific log messages
- **Network** — Run `devtrace tail network` only if you need to verify API calls, request payloads, or response status codes
- **Inspector** — Run `devtrace inspect` usually enough; gives you the summary automatically
- **Help** — Run `devtrace tail -h` or `devtrace inspect -h` if you're unsure about options

## Project-Specific Guidance

**For this project (Papertrail with Chrome extension):**
- Start DevTrace and navigate to pages where your extension is active
- Most issues will show up in the console (extension errors, content script logs)
- Check network if debugging API requests from your extension
- The `inspect` command gives you the full picture without needing to dive into logs

## Understanding `devtrace tail network`

**What it captures:**
- ALL HTTP requests from your entire Chrome instance (not just the current page)
- Includes: API calls, page resources (images, scripts, stylesheets), webhooks, background requests, extension requests
- Shows: status code, HTTP method (GET/POST/etc.), and URL

**When data appears:**
- Immediately when a response is received or request fails
- Includes both successful requests (200 OK) and failed ones (404, 500, etc.)
- Anything happening in any tab or in the background

**Example output:**
```
200 GET https://api.example.com/users
200 POST https://api.example.com/save
404 GET https://cdn.example.com/missing-image.png
0 POST https://webhook.service.com/events     (failed request)
```

**Real-world scenario:**
1. `devtrace start`
2. Navigate to your app → see GET requests for page load
3. Click a button → see POST request to your API
4. API fails → see red 500 or 404 status immediately
5. Form submits in background → see the network call instantly

## When to Use DevTrace

Use DevTrace when:

- **Reporting a bug** — Rather than describing what happened, capture it so we can see the actual error
- **Verifying a fix** — After changes are made, we can confirm with real data that it works
- **Debugging API issues** — Use `devtrace tail network` to see failed requests in real-time
- **Debugging complex issues** — Instead of back-and-forth descriptions, we have the actual console logs, network requests, and page state
- **Testing end-to-end workflows** — Capture the full flow to ensure all parts work together
- **Documenting what went wrong** — Sessions provide concrete evidence of issues, making solutions more reliable
