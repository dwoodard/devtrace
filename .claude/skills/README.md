# DevTrace Skills

This directory contains Claude Code skills for DevTrace.

## Installation

Install the skill to your local Claude Code skills directory:

```bash
devtrace skill install
```

This creates a symlink from `~/.claude/skills/devtrace` to this directory.

## After Installation

The skill will be available in Claude Code:

```bash
/devtrace help
/devtrace start
```

## Development

The skill files are:

- **SKILL.md** — Main skill documentation with usage guide
- **README.md** — Skill overview and quick reference
- **devtrace-helper.sh** — Implementation of skill commands

When you update files here, the changes are automatically available to Claude Code (since it uses a symlink).

## Version Control

The entire skill is stored in Git at `devtrace/.claude/skills/devtrace/`. When you:

1. Push changes to GitHub
2. Pull changes locally
3. The skill is automatically updated (symlink points to the repo)

No need to manually reinstall the skill.

## Managing the Skill

```bash
# Check status
devtrace skill status

# Reinstall/update
devtrace skill install

# Show help
devtrace skill help
```

## Why a Symlink?

- ✅ Skill is version controlled in GitHub
- ✅ No duplicate files
- ✅ Changes sync automatically
- ✅ Easy to share with others
- ✅ Works across multiple machines (relative to repo)

## For Users Setting Up DevTrace

1. Clone the repo: `git clone ...`
2. Install DevTrace: `cd devtrace && npm install && npm install -g .`
3. Install the skill: `devtrace skill install`
4. Use it: `/devtrace help`
