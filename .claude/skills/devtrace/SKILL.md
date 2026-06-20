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
devtrace stop                     # Stop recording
devtrace inspect latest --changes # See key changes (errors, failures first)
```

⚠️ **Always run in background with `&`** — devtrace runs a local server that needs to keep listening to browser events. Without it, you can't continue talking to Claude.

## Commands

| Command | What It Does |
|---------|--------------|
| `devtrace start [--new] &` | Start recording in background (use & to keep terminal free) |
| `devtrace stop` | Stop recording |
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

- Use `devtrace inspect [session] --changes` to quickly find errors and failures
- Console logs can get large (80KB+) — use the `inspect` command instead of grepping raw files
- The `latest` symlink auto-repairs itself if it points to a deleted session
- **Known gap:** Need better search/filter commands for drilling into specific console messages or network requests
- Session data stored in `~/.devtrace/sessions/[timestamp]/` with: actions.jsonl, console.jsonl, network.jsonl, errors.jsonl, etc.
