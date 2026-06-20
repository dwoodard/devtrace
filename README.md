# DevTrace

**Give AI agents eyes into what you're doing on the page.**

DevTrace is a local browser observation tool that records your browser activity so an AI agent can see:
- **What you did** — clicks, navigation, form submissions, input
- **What happened as a result** — errors, network calls, page changes, performance
- **The relationship** — why something broke and what action caused it

Simple on/off control. All data stays local. No cloud dependency.

Includes a **Claude Code skill** (`/devtrace`) for seamless AI integration.

## Core Purpose

When debugging or testing:
1. **Start recording:** `devtrace start`
2. **Click around, interact, test** — the AI is watching
3. **Stop recording:** `devtrace stop`
4. **Ask the AI:** "What happened when I clicked that button?" or "What did I do wrong?"
5. **Get insights:** The AI analyzes the recorded activity, errors, and results to explain what happened

The AI can see the complete picture of your actions and their consequences, making debugging faster and more accurate.

## What DevTrace Captures

**User Actions:**
- Page navigation and URL changes
- Clicks and form submissions
- Input events (what was typed)
- Search queries and parameters

**Browser Results:**
- Console logs, warnings, errors
- Network requests and responses (including body/headers)
- Page title and content changes
- Performance metrics

**Error Context:**
- JavaScript exceptions
- Network failures
- Resource load issues
- Causation chain (what action led to what error)

All data is written to local files in a timestamped session directory.

## Installation

### Prerequisites

- Node.js 16+
- Chrome (or Chromium)

### Setup

```bash
cd /Users/dustin/projects/devtrace
npm install
npm install -g .
```

### Uninstall

```bash
npm uninstall -g devtrace
```

This installs DevTrace globally so you can use `devtrace` from anywhere.

### Install the Claude Code Skill

To use DevTrace with Claude Code (`/devtrace` command):

```bash
devtrace skill install
```

This creates a symlink in your Claude Code skills directory. The skill will be automatically available in Claude Code for AI agents to use.

## Using Your Own Chrome Browser (Default)

**By default, DevTrace now connects to your existing Chrome browser!**

This means your extensions, bookmarks, and history are all available while DevTrace monitors your activity.

Quick start:
```bash
# Terminal 1: Start Chrome with debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Terminal 2: Start DevTrace (connects to your Chrome automatically)
devtrace start
```

Want a separate Chrome instance instead?
```bash
devtrace start --new
```

See [CHROME_SETUP.md](./CHROME_SETUP.md) for detailed instructions on:
- Setting up Chrome with debugging on macOS, Linux, Windows
- Using existing Chrome vs launching new
- Troubleshooting guide

## Quick Examples

See [EXAMPLES.md](./EXAMPLES.md) for real-world usage scenarios including:

- **Basic debugging** — Record and inspect a session
- **Error analysis** — Capture and analyze JavaScript errors
- **Network monitoring** — Track HTTP requests and failures
- **AI agent workflows** — How agents use DevTrace to test web apps
- **Integration with testing** — Using DevTrace in test suites
- **Advanced examples** — Metrics extraction, session reports, comparisons

## Usage

### Start Observing

```bash
devtrace start
```

This will:

1. Create a new timestamped session directory
2. Launch Chrome with remote debugging enabled
3. Start a local HTTP API on `http://localhost:3333`
4. Connect to any open Chrome tabs and watch their activity
5. Write all events to local JSONL files and a summary JSON file

Chrome opens to a blank page. Visit any website, and DevTrace will capture everything that happens.

Press `Ctrl+C` to stop observing.

### Inspect the Latest Session

```bash
devtrace inspect latest
```

Shows a summary of the latest session:

```
📊 Session: 2026-06-19-15-30-00

URL: https://example.com/dashboard
Title: Dashboard
Last navigation: 2026-06-19T15:30:00.000Z

Summary:
  Console errors: 2
  Console warnings: 4
  Failed requests: 1
  Last error: Cannot read properties of undefined

Recent console messages:
  error: Cannot read properties of undefined
  warn: Deprecated API used
  ...

Recent network requests:
  200 GET https://api.example.com/data
  404 GET https://api.example.com/missing
  ...
```

### Follow Console Logs

```bash
devtrace tail console
```

Streams console messages in real-time:

```
log: Page initialized
warn: Slow rendering detected
error: Failed to load config
```

### Follow Network Activity

```bash
devtrace tail network
```

Streams network requests and responses:

```
200 GET https://api.example.com/users
201 POST https://api.example.com/users
404 GET https://cdn.example.com/missing.js
```

## Session Output

Sessions are stored in `./sessions/` with this structure:

```
sessions/
  latest/                         → symlink to the most recent session
  2026-06-19-15-30-00/           → timestamped session directory
    current-state.json           → AI-readable summary
    console.jsonl                → raw console events
    network.jsonl                → raw network events
    errors.jsonl                 → raw error events
    events.jsonl                 → all events combined
```

### `current-state.json`

A single JSON object optimized for AI inspection:

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
    {
      "level": "log",
      "text": "Page initialized",
      "timestamp": "2026-06-19T15:30:01.000Z"
    },
    {
      "level": "error",
      "text": "Cannot read properties of undefined",
      "timestamp": "2026-06-19T15:30:02.000Z"
    }
  ],
  "network": [
    {
      "url": "https://api.example.com/users",
      "method": "GET",
      "status": 200,
      "timestamp": "2026-06-19T15:30:01.500Z"
    },
    {
      "url": "https://api.example.com/missing",
      "method": "GET",
      "status": 404,
      "timestamp": "2026-06-19T15:30:02.000Z"
    }
  ],
  "errors": [
    {
      "text": "Cannot read properties of undefined",
      "url": "https://example.com/dashboard",
      "line": 42,
      "column": 10,
      "timestamp": "2026-06-19T15:30:02.000Z"
    }
  ],
  "pageSnapshot": {
    "title": "Dashboard",
    "text": "Dashboard\nWelcome user\nClick here to continue...",
    "buttons": [
      {"text": "Continue", "id": "continue-btn"},
      {"text": "Cancel", "id": "cancel-btn"}
    ],
    "links": [
      {"text": "Help", "href": "https://example.com/help"}
    ],
    "forms": [
      {
        "id": "login-form",
        "name": "login",
        "inputs": [
          {"name": "username", "type": "text"},
          {"name": "password", "type": "password"}
        ]
      }
    ]
  }
}
```

### JSONL Files

Raw event logs in JSONL format (one JSON object per line):

**console.jsonl:**
```jsonl
{"level":"log","text":"Page initialized","timestamp":"2026-06-19T15:30:01.000Z"}
{"level":"error","text":"Cannot read properties of undefined","timestamp":"2026-06-19T15:30:02.000Z"}
```

**network.jsonl:**
```jsonl
{"url":"https://api.example.com/users","method":"GET","status":200,"timestamp":"2026-06-19T15:30:01.500Z"}
{"url":"https://api.example.com/missing","method":"GET","status":404,"timestamp":"2026-06-19T15:30:02.000Z"}
```

## Local API

DevTrace runs a local HTTP API on `http://localhost:3333`:

```bash
# Get the latest session state
curl http://localhost:3333/latest

# Get console messages
curl http://localhost:3333/latest/console

# Get network requests
curl http://localhost:3333/latest/network

# Get errors
curl http://localhost:3333/latest/errors

# Get page snapshot
curl http://localhost:3333/latest/page

# Health check
curl http://localhost:3333/health
```

## Observer Loop

When you run `devtrace start`, it starts an observer loop that:

### Trigger
The loop starts when the user runs `devtrace start`.

### Goal
Continuously observe Chrome tab activity and maintain an AI-readable summary of the current browser state.

### Loop Cycle

Every 2 seconds, the loop:

1. **Discovers** active Chrome targets (tabs, windows)
2. **Attaches** to any new tabs via the Chrome DevTools Protocol
3. **Listens** for events from the DevTools Protocol
4. **Captures** console, error, network, and page events
5. **Appends** raw events to JSONL files
6. **Updates** `current-state.json` with the latest state
7. **Refreshes** the page snapshot on navigation or significant changes
8. **Serves** the latest session state via the local HTTP API

### Exit

The observer stops cleanly when:

1. The user presses `Ctrl+C`
2. Chrome closes
3. A fatal connection error occurs

On exit, it:

1. Flushes all pending logs
2. Writes the final `current-state.json`
3. Closes all Chrome connections
4. Stops the local API
5. Prints the session folder path

## First Test

Try this to verify everything works:

```bash
# Terminal 1: Start observing
devtrace start

# Terminal 2: While it's running, do this
curl http://localhost:3333/latest
```

Then in Chrome:

1. Visit any website
2. Open the browser console (Cmd+Option+J)
3. Run:
   ```js
   console.log('hello from devtrace')
   console.error('test error from devtrace')
   ```

Check the session:

```bash
devtrace inspect latest
```

You should see your console messages captured.

Or look at the files:

```bash
cat sessions/latest/console.jsonl
cat sessions/latest/current-state.json
```

## Using with Claude Code

Once the skill is installed, you can use DevTrace from Claude Code:

```bash
/devtrace help              Show all commands
/devtrace start             Launch Chrome and observe
/devtrace inspect           View session summary
/devtrace console           Show console messages
/devtrace network           Show network requests
/devtrace api               Get full session state as JSON
/devtrace status            Check if DevTrace is running
/devtrace files             List session files
```

AI agents can use these commands to:
1. Trigger browser behavior
2. Record activity via DevTrace
3. Query the local API to inspect results
4. Analyze console errors and network failures
5. Make decisions based on what happened

## Managing the Skill

```bash
devtrace skill install      Create/update the skill symlink
devtrace skill status       Check skill installation status
devtrace skill update       Verify/reinstall the skill
devtrace skill help         Show skill management commands
```

The skill is stored in the repository at `.claude/skills/devtrace/` and symlinked to your Claude Code skills directory.

## Architecture

- **bin/devtrace** — CLI entry point
- **src/cli/** — Command handlers (start, inspect, tail, open, skill)
- **src/chrome/** — Chrome DevTools Protocol integration
- **src/capture/** — Event capture for console, network, errors, pages
- **src/storage/** — Session management and file writing
- **src/server/** — Local HTTP API
- **src/loop/** — Observer loop that ties everything together
- **.claude/skills/devtrace/** — Claude Code skill for AI agent integration
- **sessions/** — Session storage directory

## Future: Chrome Extension

This project is structured so a Chrome extension can be added later to:

- Inject additional debugging hooks into the page
- Capture more granular performance metrics
- Track user interactions (clicks, scrolls, form inputs)
- Send data directly to the daemon without CDP
- Provide a visual UI in the browser

The first version intentionally avoids this complexity. The daemon-based approach is simpler and doesn't require users to install an extension.

## Notes

- The first version is intentionally simple and readable.
- It prioritizes clear code over clever abstractions.
- Chrome is launched with a dedicated profile directory to avoid conflicts with your personal Chrome instance.
- Sessions are timestamped and stored locally for easy inspection.
- The JSON contract (especially `current-state.json`) is designed for AI agent inspection.
- All errors are logged, but they don't crash the observer loop.

## Documentation

- **[CHROME_SETUP.md](./CHROME_SETUP.md)** — How to use your existing Chrome browser
- **[EXAMPLES.md](./EXAMPLES.md)** — Real-world usage examples and workflows
- **[QUICKSTART.md](./QUICKSTART.md)** — Quick start guide
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** — Architecture and implementation details
- **[SKILL.md](./.claude/skills/devtrace/SKILL.md)** — Claude Code skill guide

## Troubleshooting

**Chrome doesn't open:**

Make sure Chrome is installed and in your PATH. The tool uses the system's Chrome.

**No data being captured:**

Check that you visited a website in Chrome. DevTrace only captures events for the pages you navigate to.

**Local API not responding:**

The API runs on port 3333 by default. Make sure it's not already in use:

```bash
lsof -i :3333
```

**Session files not being written:**

Check that `./sessions/` is writable and has space available.
