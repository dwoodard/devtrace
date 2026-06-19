# DevTrace Implementation Summary

## Installation

### Prerequisites
- Node.js 16 or later
- Chrome or Chromium browser

### Setup

```bash
cd /Users/dustin/projects/devtrace
npm install
npm install -g .
```

This installs DevTrace globally so you can run `devtrace` from anywhere.

Dependencies installed:
- `chrome-launcher` — Launch Chrome with debugging
- `express` — HTTP API server
- `ws` — WebSocket client for DevTools Protocol
- `uuid` — Session ID generation
- `chalk` — Terminal colors

### Install the Claude Code Skill

To enable AI agents to use DevTrace:

```bash
devtrace skill install
```

This creates a symlink from `~/.claude/skills/devtrace/` to the skill in the repo. The skill will be available in Claude Code as `/devtrace`.

## Quick Start

### Via Command Line

```bash
devtrace start
```

This will:
1. Launch Chrome with remote debugging enabled
2. Create a new timestamped session directory in `./sessions/`
3. Start a local HTTP API on `http://localhost:3333`
4. Begin watching any tabs you open in Chrome

Press `Ctrl+C` to stop.

### Via Claude Code Skill

First, install the skill:

```bash
devtrace skill install
```

Then in Claude Code:

```bash
/devtrace start
```

This does the same thing as the CLI command, but from within Claude Code.

### Inspect Results (in another terminal)

```bash
# View session summary
devtrace inspect latest

# Follow console messages live
devtrace tail console

# Follow network requests live
devtrace tail network
```

### Query the Local API

```bash
# Full session state
curl http://localhost:3333/latest | jq .

# Just console messages
curl http://localhost:3333/latest/console | jq .

# Just network requests
curl http://localhost:3333/latest/network | jq .

# Health check
curl http://localhost:3333/health | jq .
```

### Test It Yourself

1. Run `devtrace start`
2. Navigate to any website in Chrome
3. Open the console (Cmd+Option+J)
4. Run:
   ```js
   console.log('hello from devtrace')
   console.error('test error from devtrace')
   ```
5. In another terminal:
   ```bash
   devtrace inspect latest
   ```
6. You should see your console messages captured

### Session Files

After running DevTrace, check these files:

```bash
# AI-readable summary (keeps last 20 messages)
cat sessions/latest/current-state.json | jq .

# Raw console events (JSONL format)
cat sessions/latest/console.jsonl

# Raw network events (JSONL format)
cat sessions/latest/network.jsonl

# All events combined
cat sessions/latest/events.jsonl
```

---

## Project Overview

DevTrace is a local browser observation tool that connects to Chrome through the Chrome DevTools Protocol (CDP) and records what happened in the browser. All data is written to local files and served via a local HTTP API, making it easy for AI agents (or humans) to inspect browser state without relying on manual DevTools export.

## What Was Built

### 1. CLI Interface (`src/cli/`)

- **start.js** — Launches Chrome, initializes session, starts observer loop
- **inspect.js** — Shows a summary of the latest session
- **tail.js** — Follows console or network events in real-time
- **open.js** — Opens the latest session in the browser
- **index.js** — Command router

### 2. Chrome Integration (`src/chrome/`)

- **launchChrome.js** — Uses `chrome-launcher` to launch Chrome with DevTools port enabled
- **discoverTargets.js** — Queries Chrome's `/json/list` endpoint to find all tabs and windows
- **attachToTarget.js** — Implements CDPClient class that communicates via WebSocket with Chrome's DevTools Protocol

### 3. Event Capture (`src/capture/`)

- **consoleCapture.js** — Listens for `Runtime.consoleAPICalled` and `Runtime.exceptionThrown` events
- **networkCapture.js** — Listens for `Network.requestWillBeSent`, `Network.responseReceived`, and `Network.loadingFailed` events
- **errorCapture.js** — Listens for `Runtime.exceptionThrown` events with stack traces
- **pageSnapshot.js** — Extracts page title, text content, buttons, links, and forms via `Runtime.evaluate`

### 4. Storage Layer (`src/storage/`)

- **sessionManager.js** — Creates timestamped session directories and maintains a `latest` symlink
- **jsonlWriter.js** — Appends events to JSONL files with buffering and periodic flushing
- **currentStateWriter.js** — Maintains and updates `current-state.json` with the latest session state

### 5. Local HTTP API (`src/server/`)

- **localApi.js** — Express server that serves:
  - `GET /health` — Health check
  - `GET /latest` — Full session state
  - `GET /latest/console` — Console messages
  - `GET /latest/network` — Network requests
  - `GET /latest/errors` — Errors
  - `GET /latest/page` — Page snapshot

### 6. Observer Loop (`src/loop/`)

- **observerLoop.js** — Main event loop that:
  1. Discovers active Chrome targets every 2 seconds
  2. Attaches to any new tabs via CDP
  3. Sets up event listeners for console, network, errors, and page changes
  4. Writes events to JSONL files
  5. Updates `current-state.json` continuously
  6. Takes page snapshots on navigation
  7. Handles graceful shutdown on SIGINT or Chrome close

### 7. Claude Code Skill (`.claude/skills/devtrace/`)

- **SKILL.md** — Comprehensive skill documentation with:
  - When to use DevTrace
  - All available commands with examples
  - Real-world usage scenarios
  - Agent integration patterns
  - Decision trees for when/how to use
- **README.md** — Skill overview and quick reference
- **devtrace-helper.sh** — Shell script implementing skill commands

### 8. Skill Management (`src/cli/skill.js`)

- **skill.js** — Implements DevTrace skill installation:
  - `devtrace skill install` — Install the skill to `~/.claude/skills`
  - `devtrace skill status` — Check installation status
  - `devtrace skill update` — Verify/reinstall the skill
  - `devtrace skill help` — Show skill management help
  - Uses relative symlinks for portability across machines

## Architecture & Design

### Observer Loop

The observer loop has clear trigger, goal, and exit conditions:

**Trigger:** User runs `devtrace start`

**Goal:** Continuously observe Chrome tab activity and maintain an AI-readable summary

**Loop:**
1. Every 2 seconds, query Chrome for active targets
2. For each new 'page' type target, establish a CDP connection
3. Listen for events from the target
4. On event, write to JSONL and update current-state.json
5. Refresh page snapshot on navigation

**Exit:**
- User presses Ctrl+C
- Chrome closes
- Fatal connection error

### Data Flow

```
Chrome Browser
    ↓ (Chrome DevTools Protocol via WebSocket)
CDP Client (attachToTarget.js)
    ↓
Event Listeners (consoleCapture, networkCapture, etc.)
    ↓
JsonlWriter (append to .jsonl files)
    ↓
CurrentStateWriter (update current-state.json)
    ↓
LocalApi (serve via HTTP)
    ↓
Claude Code Skill (/devtrace commands)
    ↓
AI Agents (query results, make decisions)
```

### Session Structure

```
sessions/
  2026-06-19-15-30-00/
    current-state.json           (AI-readable summary, ~1-2KB)
    console.jsonl                (raw console events)
    network.jsonl                (raw network events)
    errors.jsonl                 (raw error events)
    events.jsonl                 (all events combined)
  latest/                         (symlink to most recent)
```

## Key Files

| File | Purpose |
|------|---------|
| `bin/devtrace` | CLI entry point |
| `src/cli/start.js` | Main command that orchestrates everything |
| `src/cli/skill.js` | Skill installation and management |
| `src/chrome/attachToTarget.js` | CDP protocol client |
| `src/capture/*.js` | Event listeners for different data types |
| `src/storage/currentStateWriter.js` | Maintains AI-readable summary |
| `src/loop/observerLoop.js` | Main observer loop |
| `src/server/localApi.js` | HTTP API for querying sessions |
| `.claude/skills/devtrace/SKILL.md` | Claude Code skill documentation |
| `.claude/skills/devtrace/devtrace-helper.sh` | Skill command implementation |

## Technologies Used

- **Node.js** — JavaScript runtime
- **chrome-launcher** — Launch Chrome with debugging enabled
- **ws** — WebSocket client for CDP
- **express** — HTTP server for local API
- **JSONL** — Format for streaming events
- **JSON** — Format for state snapshots

## Testing

The project includes an integration test (`test-integration.js`) that:

1. Starts DevTrace
2. Connects to Chrome via CDP
3. Executes console commands
4. Verifies events are captured in JSONL files
5. Verifies events appear in current-state.json
6. Confirms the local API is working

Run with: `node test-integration.js`

## What's NOT Included (by design)

- **Chrome Extension** — Intentionally deferred; the daemon approach is simpler
- **AI Logic** — Just captures data; AI processes it via the API or files
- **GUI Dashboard** — Static files could be served, but not implemented
- **Database** — Everything is files; no database layer
- **Advanced analytics** — Just captures events; analysis is external

## Future Possibilities

1. **Chrome Extension** — For injected hooks and more granular events
2. **Performance Metrics** — Capture paint events, CPU time, memory usage
3. **User Interaction Tracking** — Clicks, form submissions, scrolls
4. **Visual Regression Detection** — Screenshot comparisons
5. **Storage Optimization** — Compress old sessions, archive to cloud
6. **Multi-tab Synchronization** — Cross-tab event tracking
7. **Custom Capture Rules** — User-defined event filters
8. **Web Dashboard** — Visual interface for browsing sessions
9. **Advanced Skill Integration** — Deeper Claude Code integration with multi-step workflows

## Error Handling

- Failed captures don't crash the loop; errors are logged to `errors.jsonl`
- Network timeouts are handled with retries
- CDP disconnections trigger a re-discovery cycle
- Graceful shutdown flushes all pending writes

## Performance Considerations

- JSONL writes are buffered (flushed every 1s or 100 events)
- current-state.json is written synchronously (small file, always fresh)
- Page snapshots only taken on navigation (not every event)
- Discovery loop runs every 2s (not constantly polling)
- In-memory arrays limited to 20 console/network items (space-efficient)

## Code Quality

- **Readable over clever** — Clear variable names, no unnecessary abstractions
- **No premature optimization** — Simple, straightforward implementations
- **Minimal dependencies** — Only 4 prod dependencies
- **Error handling** — All errors caught, none crash the loop
- **Comments** — Only where WHY is non-obvious

## Claude Code Skill Integration

DevTrace includes a comprehensive Claude Code skill for seamless AI agent integration:

### Skill Architecture

```
.claude/skills/devtrace/
  ├── SKILL.md                 ← Comprehensive guide (5KB+)
  ├── README.md                ← Quick reference
  └── devtrace-helper.sh       ← Command implementation
```

Installed via symlink to `~/.claude/skills/devtrace/` (portable, relative paths)

### Skill Commands

- `/devtrace start` — Launch Chrome and observe
- `/devtrace stop` — Stop observing
- `/devtrace status` — Check if running
- `/devtrace inspect` — View session summary
- `/devtrace console` — Show console messages
- `/devtrace network` — Show network requests
- `/devtrace api` — Get full JSON state
- `/devtrace files` — List session files
- `/devtrace tail-console` — Follow console live
- `/devtrace tail-network` — Follow network live
- `/devtrace logs` — View full session JSON
- `/devtrace help` — Show skill reference

### CLI Management Commands

```bash
devtrace skill install      # Install skill to ~/.claude/skills
devtrace skill status       # Check installation status
devtrace skill update       # Verify/reinstall skill
devtrace skill help         # Show management help
```

### Agent Workflow

Agents can use DevTrace to:

1. **Trigger behavior** — Navigate, click, interact with page
2. **Record activity** — `/devtrace start` captures everything
3. **Analyze results** — `/devtrace api` or `/devtrace inspect`
4. **Make decisions** — Based on console errors, network failures, page state
5. **Take action** — Retry, fix, or report issues
6. **Repeat** — Loop until test/task complete

### Portability

- Uses **relative symlinks** (`../../projects/devtrace/.claude/skills/devtrace`)
- Works across different machines with repo at `~/projects/devtrace`
- Automatically syncs with git updates
- No manual reinstallation needed

## Success Criteria (All Met)

✅ DevTrace launches and connects to Chrome
✅ Console logs are captured
✅ Console errors are captured
✅ Network requests are captured
✅ Page URLs and titles are captured
✅ Page snapshots include buttons, links, forms
✅ Session data written to local files
✅ Local HTTP API working
✅ CLI commands implemented (start, inspect, tail, open, skill)
✅ Observer loop with clear trigger, goal, and exit
✅ AI-readable current-state.json
✅ JSONL files for raw events
✅ Graceful shutdown
✅ Claude Code skill with comprehensive documentation
✅ Skill management commands (install, status, update)
✅ Portable symlink setup (relative paths)
✅ Agent-friendly API and commands

## Usage Examples

```bash
# Start observing
devtrace start

# In another terminal while it's running
devtrace inspect latest
devtrace tail console
devtrace tail network

# Query the API
curl http://localhost:3333/latest | jq .

# Check files directly
cat sessions/latest/console.jsonl
cat sessions/latest/current-state.json
```

## Next Steps

The tool is ready for use. Next phase would be:

1. Use `current-state.json` as input to AI agents
2. Add a Chrome extension for more granular events
3. Build higher-level analysis on top of the raw event streams
4. Create visualizations of browser activity

## Documentation Index

- **[EXAMPLES.md](./EXAMPLES.md)** — Real-world usage examples and workflows
- **[README.md](./README.md)** — Complete feature documentation
- **[QUICKSTART.md](./QUICKSTART.md)** — Quick start guide
- **[SKILL.md](./.claude/skills/devtrace/SKILL.md)** — Claude Code skill guide

## Implementation Notes

- Profile dir: `~/.devtrace/.chrome-profile`
- DevTools port: `9222` (configurable)
- API port: `3333` (configurable)
- Session directory: `./sessions/`
- Discovery interval: `2000ms`
- JSONL flush interval: `1000ms`
