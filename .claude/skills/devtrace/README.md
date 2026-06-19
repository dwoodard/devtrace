# DevTrace Skill

A comprehensive skill for working with the DevTrace local browser observation tool.

## What This Skill Does

This skill enables you to easily:

- **Start/stop browser observation** — Launch Chrome and record everything
- **Inspect results** — View console logs, network requests, page state
- **Query the API** — Get structured session data for analysis
- **Monitor live** — Follow events as they happen
- **Manage sessions** — View and manage recording sessions

## When to Use This Skill

Use `/devtrace` when you need to:

✅ Debug a web application by recording browser activity
✅ Let AI agents inspect browser state after interactions
✅ Capture console errors and network failures
✅ Record a browser session for later analysis
✅ Monitor network activity during testing
✅ Understand what happened during a user interaction

## Available Commands

```bash
/devtrace start          # Launch Chrome and start observing
/devtrace stop           # Stop the current session
/devtrace status         # Check if DevTrace is running
/devtrace inspect        # View session summary
/devtrace console        # Show recent console messages
/devtrace network        # Show recent network requests
/devtrace api            # Query the local API (full JSON)
/devtrace files          # List session files
/devtrace tail-console   # Follow console messages live
/devtrace tail-network   # Follow network requests live
/devtrace logs           # View full session state
/devtrace help           # Show command reference
```

## Quick Examples

### Debug a Web App

```bash
/devtrace start
# (navigate to your app in Chrome)
# (interact with it, trigger errors, etc.)
/devtrace inspect
/devtrace console    # See all console messages
/devtrace network    # See all network requests
```

### Let AI Inspect Browser State

```bash
/devtrace start
# (run tests or interactions)
/devtrace api        # Get full session state as JSON
# AI can now analyze the results
```

### Monitor Network Activity

```bash
/devtrace start
/devtrace tail-network    # Follow requests as they happen
```

## Session Data

Every session creates files like:

```
sessions/latest/
  current-state.json          # AI-readable summary (JSON)
  console.jsonl               # Console events (one per line)
  network.jsonl               # Network requests (one per line)
  errors.jsonl                # JavaScript errors
  events.jsonl                # All events combined
```

The `current-state.json` format:

```json
{
  "sessionId": "2026-06-19-15-30-00",
  "activeUrl": "https://example.com",
  "title": "Page Title",
  "summary": {
    "consoleErrors": 0,
    "consoleWarnings": 0,
    "failedRequests": 0,
    "lastError": null
  },
  "console": [...],
  "network": [...],
  "errors": [...],
  "pageSnapshot": {
    "buttons": [...],
    "links": [...],
    "forms": [...]
  }
}
```

## Implementation Details

- **Location:** `/Users/dustin/projects/devtrace`
- **Skill:** `/Users/dustin/.claude/skills/devtrace`
- **Helper script:** `devtrace-helper.sh`
- **Commands:** Implemented via `devtrace` CLI

## Setup

DevTrace is already set up and installed globally. Just use:

```bash
/devtrace start
```

If you need to reinstall:

```bash
cd /Users/dustin/projects/devtrace
npm install
npm install -g .
```

## Integration with Agents

Agents can use DevTrace to:

1. **Trigger behavior** → Navigate to website, click buttons
2. **Record activity** → Let DevTrace capture all events
3. **Analyze results** → Query `/latest` endpoint or read files
4. **Make decisions** → Based on console errors, network failures, page state
5. **Take next steps** → Retry, fix, or report issues

Example agent workflow:

```
1. /devtrace start
2. (Trigger some action)
3. /devtrace api          # Get session state
4. Parse response for errors/issues
5. Take corrective action
6. Repeat or conclude
```

## Local API

While running, DevTrace serves a local API on `http://localhost:3333`:

```bash
# Full session state
curl http://localhost:3333/latest | jq .

# Console messages
curl http://localhost:3333/latest/console | jq .

# Network requests
curl http://localhost:3333/latest/network | jq .

# JavaScript errors
curl http://localhost:3333/latest/errors | jq .

# Page snapshot
curl http://localhost:3333/latest/page | jq .

# Health check
curl http://localhost:3333/health | jq .
```

## Documentation

- **Quick start:** `/Users/dustin/projects/devtrace/QUICKSTART.md`
- **Full docs:** `/Users/dustin/projects/devtrace/README.md`
- **Implementation:** `/Users/dustin/projects/devtrace/IMPLEMENTATION.md`

## For Agents

Everything an AI agent needs to know is in this skill. Agents should:

1. **Know when to use it** — When debugging web apps or analyzing browser state
2. **Know how to use it** — Start with `/devtrace start`, then query `/latest`
3. **Understand the data** — current-state.json format and API responses
4. **Handle the lifecycle** — Start session, trigger behavior, analyze results, stop

See the SKILL.md file for complete agent guidance and decision trees.
