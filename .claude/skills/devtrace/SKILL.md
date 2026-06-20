---
name: devtrace
argument-hint: <command>
description: Local browser observation tool - record browser activity (actions, console, network, errors) for AI debugging
---

# DevTrace Skill

DevTrace records what you do in your browser and what happens as a result. This gives AI complete visibility into actions → errors → causation.

## Quick Start

```
devtrace start                    # Start recording
[do stuff in browser]
devtrace stop                     # Stop recording
devtrace inspect latest --changes # See what happened
```

## Commands

| Command | What It Does |
|---------|--------------|
| `devtrace start [--new]` | Start recording (--new for fresh Chrome instance) |
| `devtrace stop` | Stop recording |
| `devtrace inspect [session]` | Show session summary |
| `devtrace inspect --changes` | Show top 3-4 key changes (errors/failures first) |
| `devtrace tail [console\|network]` | Stream logs in real-time |
| `devtrace open` | Open latest session in browser |
| `devtrace clean [--force]` | Delete sessions (--force to confirm) |
| `devtrace -h` | Help for any command |

## What Gets Captured

- **Your actions**: navigation, clicks, form submissions
- **Page state**: titles, URLs, search queries, content
- **Browser events**: console logs, network calls, errors, performance

All stored in `~/.devtrace/sessions/` (accessible from any project).

## For Debugging

Instead of: "Something broke, what do I do?"
You get: "I see you clicked X, which triggered API call Y, which failed with error Z"

The AI sees the complete picture and can debug faster.
