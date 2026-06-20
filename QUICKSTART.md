# DevTrace Quick Start

## Installation (one-time setup)

```bash
cd /Users/dustin/projects/devtrace
npm install
npm install -g .
```

This installs the DevTrace CLI globally.

### Optional: Install the Claude Code Skill

If you want to use DevTrace with Claude Code (`/devtrace` commands):

```bash
devtrace skill install
```

This creates a symlink to the skill in your Claude Code skills directory. Once installed, you can use:
- `/devtrace help` — Show skill commands
- `/devtrace start` — Start observing from Claude Code
- `/devtrace inspect` — View results
- And more!

## Start Observing

```bash
devtrace start
```

This launches Chrome and opens a local API on `http://localhost:3333`.

In Chrome, navigate to any website. DevTrace will capture:
- All console logs, warnings, and errors
- Network requests and responses
- Page URLs and titles
- Basic page snapshots

Press `Ctrl+C` to stop.

## Inspect Results

```bash
# See a summary of the latest session
devtrace inspect latest

# Follow console logs in real-time
devtrace tail console

# Follow network requests in real-time
devtrace tail network
```

## Session Files

Sessions are stored in `./sessions/latest/`:

- `current-state.json` — AI-readable summary (always updated)
- `console.jsonl` — Raw console events (JSONL format)
- `network.jsonl` — Raw network events (JSONL format)
- `errors.jsonl` — Raw error events (JSONL format)
- `events.jsonl` — All events combined (JSONL format)

## Local API

While `devtrace start` is running, query the local API:

```bash
# Get full session state
curl http://localhost:3333/latest | jq .

# Get just console messages
curl http://localhost:3333/latest/console | jq .

# Get network requests
curl http://localhost:3333/latest/network | jq .

# Get errors
curl http://localhost:3333/latest/errors | jq .

# Get page snapshot
curl http://localhost:3333/latest/page | jq .

# Health check
curl http://localhost:3333/health | jq .
```

## Test It

1. Run `devtrace start`
2. In Chrome, visit any website
3. Open the console (Cmd+Option+J)
4. Paste and run:
   ```js
   console.log('hello from devtrace')
   console.error('test error from devtrace')
   ```
5. In another terminal, run:
   ```bash
   devtrace inspect latest
   ```

You should see your console messages captured.

## Architecture

- **CDPClient** — Connects to Chrome via WebSocket
- **discoverTargets** — Finds active Chrome tabs
- **consoleCapture** — Listens for console events
- **networkCapture** — Listens for network events
- **errorCapture** — Listens for JavaScript errors
- **pageSnapshot** — Captures page state (title, buttons, links, forms)
- **observerLoop** — Main loop that discovers tabs and captures events
- **localApi** — Express server that serves session data
- **sessionManager** — Creates and manages session directories

## Next Steps

- **AI integration** — Agents can read `sessions/latest/current-state.json` to understand browser state
- **Chrome Extension** — Could be added to capture more granular events
- **Custom metrics** — Extend the capture modules to track additional data

## Troubleshooting

**Chrome won't launch?**
Make sure Chrome is installed and in your PATH.

**No data captured?**
Make sure you navigate to a website in Chrome (not just `about:blank`).

**API not responding?**
Port 3333 might be in use. Check: `lsof -i :3333`

**Files not being written?**
Check that `~/.devtrace/sessions/` is writable: `ls -la sessions/`

## Using the Claude Code Skill

Once you've run `devtrace skill install`, the skill is available in Claude Code:

```bash
# In Claude Code or Claude CLI:
/devtrace help              Show all skill commands
/devtrace start             Launch Chrome
/devtrace inspect           View latest session
/devtrace console           Show console messages
/devtrace network           Show network requests
/devtrace api               Get full JSON state
/devtrace status            Check if running
```

### Agent Workflow

AI agents can use the skill to:

```bash
# Start observing
/devtrace start

# Trigger some behavior (navigate, click, etc.)
# ... (happens in Chrome)

# Check what happened
/devtrace api | jq .

# Analyze results and take next action
```

## Managing the Skill

```bash
# Check installation status
devtrace skill status

# Reinstall/update the skill
devtrace skill install

# Show skill management help
devtrace skill help
```

## For Full Documentation

- [EXAMPLES.md](./EXAMPLES.md) — Real-world usage examples
- [README.md](./README.md) — Full feature documentation
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) — Architecture and design details
- `.claude/skills/devtrace/SKILL.md` — Comprehensive skill guide
