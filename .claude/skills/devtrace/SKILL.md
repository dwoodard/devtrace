---
name: devtrace
argument-hint: <command>
description: Local browser observation tool - record browser activity (actions, console, network, errors) for AI debugging
---

# DevTrace Skill

DevTrace records what you do in your browser and what happens as a result. This gives AI complete visibility into actions → errors → causation.

## Quick Start

```
devtrace start --new &            # Start recording in background (& keeps terminal free)
[do stuff in browser]
devtrace see                      # Quick view of what just happened
devtrace stop                     # Stop recording
```

⚠️ **Always run in background with `&`** — devtrace runs a local server that needs to keep listening to browser events. Without it, you can't continue talking to Claude.

## Quick View Examples

```bash
# See latest activity (entire session)
devtrace see

# See only last 30 seconds
devtrace see --ago=30

# See only errors and warnings
devtrace see --errors-only

# See only traffic to specific domain
devtrace see --domain=api.example.com

# See as JSON (for parsing)
devtrace see --json
```

## Commands

| Command | What It Does |
|---------|--------------|
| `devtrace start [--new] &` | Start recording in background (use & to keep terminal free) |
| `devtrace stop` | Stop recording |
| `devtrace see [options]` | Quick view of latest activity (compact, token-friendly) |
| `devtrace see --ago=SECONDS` | Show activity from last N seconds |
| `devtrace see --domain=DOMAIN` | Filter to specific domain (e.g., api.example.com) |
| `devtrace see --errors-only` | Show only errors and warnings |
| `devtrace see --json` | Get structured JSON output |
| `devtrace inspect [session]` | Show session summary (URL, page title, counts) |
| `devtrace inspect [session] --changes` | Show top 3-4 key changes (errors/failures first) |
| `devtrace tail [console\|network]` | Stream logs in real-time |
| `devtrace open` | Open latest session in browser |
| `devtrace clean [--force]` | Delete sessions (--force to confirm) |
| `devtrace --help` | Full command help |

## What Gets Captured

- **Your actions**: navigation, clicks, form submissions
- **Page state**: titles, URLs, search queries, content
- **Browser events**: console logs, network calls, errors, performance

All stored in `~/.devtrace/sessions/` (accessible from any project).

## For Debugging

Instead of: "Something broke, what do I do?"
You get: "I see you clicked X, which triggered API call Y, which failed with error Z"

The AI sees the complete picture and can debug faster.

## Session Analysis Tips

- Use `devtrace see` for a quick, compact view of latest activity (perfect for AI agents)
- Use `devtrace see --ago=30` to focus on the last 30 seconds
- Use `devtrace see --domain=api.example.com` to filter by domain
- Use `devtrace inspect [session] --changes` to find errors and failures
- Console logs can get large (80KB+) — use the `see` or `inspect` commands for filtered views
- Use `devtrace see --json` to get machine-readable output for analysis
- The `latest` symlink auto-repairs itself if it points to a deleted session
- Session data stored in `~/.devtrace/sessions/[timestamp]/` with: actions.jsonl, console.jsonl, network.jsonl, errors.jsonl, etc.
