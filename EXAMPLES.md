# DevTrace Examples

Real-world examples of how to use DevTrace for debugging, testing, and AI agent automation.

## Table of Contents

1. [Quick View of Activity](#quick-view-of-activity)
2. [Basic Usage](#basic-usage)
3. [Debugging a Web App](#debugging-a-web-app)
4. [Capturing Console Errors](#capturing-console-errors)
5. [Monitoring Network Activity](#monitoring-network-activity)
6. [AI Agent Workflows](#ai-agent-workflows)
7. [Integration with Testing](#integration-with-testing)

---

## Quick View of Activity

### Example 0: See What Just Happened

The fastest way to debug—get a clean summary of recent activity:

```bash
# Terminal 1: Start observing
devtrace start

# (In Chrome, do some stuff—navigate, click buttons, trigger errors)
# (Leave it running)

# Terminal 2: Quick view of what just happened
devtrace see
```

Output:
```
[SUMMARY]
Logs: 12 | Warns: 0 | Errors: 0 | Network: 8 (8 OK, 0 failed) | Time: entire session

[TIMELINE]
13:16:51.698  ✓ GET http://api.example.com/projects (200, 147ms)
13:16:51.710  ✓ Page load complete
13:16:52.001  ✓ POST http://api.example.com/submit (201, 156ms)
13:16:52.410  ✓ Navigation to /success
```

#### Filter by Time or Domain

```bash
# Last 30 seconds only
devtrace see --ago=30

# Only network traffic to specific domain
devtrace see --domain=api.example.com

# Last 10 seconds from a specific domain
devtrace see --ago=10 --domain=api.example.com

# Only show errors and warnings
devtrace see --errors-only

# Get JSON for programmatic use
devtrace see --json
```

**Why use `devtrace see`?**
- Fast and focused (no noise)
- Errors shown first
- Timestamps and durations
- Compact, token-friendly output for AI agents
- Perfect for "did I break something?" checks

---

## Basic Usage

### Example 1: Record a Simple Session

The most basic workflow:

```bash
# Terminal 1: Start observing
devtrace start

# (In Chrome, navigate to a website)
# (Do something, interact with the page)
# (Then press Ctrl+C to stop)

# Terminal 2: While it's running
devtrace inspect latest
```

Output:
```
📊 Session: 2026-06-19-15-30-00

URL: https://example.com/dashboard
Title: Dashboard
Last navigation: 2026-06-19T15:30:00.000Z

Summary:
  Console errors: 0
  Console warnings: 2
  Failed requests: 0
  Last error: null

Recent console messages:
  log: Page initialized
  warn: Deprecated API usage detected
```

---

## Debugging a Web App

### Example 2: Debug JavaScript Errors

Capture and analyze errors from a web application:

```bash
# Terminal 1: Start DevTrace
devtrace start

# In Chrome:
# 1. Navigate to https://localhost:3000/app
# 2. Trigger an error (click a button that causes an error)
# 3. See the error in the console

# Terminal 2: Check what happened
devtrace inspect latest
```

Session now shows:
```json
{
  "summary": {
    "consoleErrors": 1,
    "consoleWarnings": 0,
    "failedRequests": 0,
    "lastError": "Cannot read properties of undefined (reading 'map')"
  },
  "errors": [
    {
      "text": "Cannot read properties of undefined (reading 'map')",
      "url": "https://localhost:3000/app",
      "line": 42,
      "column": 15,
      "timestamp": "2026-06-19T15:30:02.000Z"
    }
  ]
}
```

View the raw error file:
```bash
cat sessions/latest/errors.jsonl | jq .
```

---

## Capturing Console Errors

### Example 3: Follow Console Output in Real-Time

Monitor console messages as they happen:

```bash
# Terminal 1: Start DevTrace
devtrace start

# Terminal 2: Follow console messages live
devtrace tail console
```

As you interact with the website in Chrome, you see:

```
📡 Following console events (Ctrl+C to exit)

log: User logged in
log: Loading dashboard data
warn: Deprecated method used
error: API request failed: 404
```

### Example 4: Analyze Console Logs After Session

```bash
# Start a session
devtrace start

# (Do something that produces logs)
# (Stop with Ctrl+C)

# View all console messages
devtrace console
```

Output:
```json
[
  {
    "level": "log",
    "text": "Page initialized",
    "timestamp": "2026-06-19T15:30:01.000Z"
  },
  {
    "level": "warn",
    "text": "Slow rendering detected",
    "timestamp": "2026-06-19T15:30:01.500Z"
  },
  {
    "level": "error",
    "text": "Failed to load config",
    "timestamp": "2026-06-19T15:30:02.000Z"
  }
]
```

---

## Monitoring Network Activity

### Example 5: Follow Network Requests in Real-Time

Track all network activity as it happens:

```bash
# Terminal 1: Start DevTrace
devtrace start

# Terminal 2: Follow network requests
devtrace tail network
```

As you navigate and interact in Chrome:

```
📡 Following network events (Ctrl+C to exit)

200 GET https://api.example.com/users
200 POST https://api.example.com/login
404 GET https://cdn.example.com/missing.css
500 POST https://api.example.com/submit
```

### Example 6: Check Network Failures

```bash
# Start a session
devtrace start

# (Trigger some network requests, including failures)
# (Stop with Ctrl+C)

# View network summary
devtrace network
```

Output:
```json
[
  {
    "url": "https://api.example.com/users",
    "method": "GET",
    "status": 200,
    "timestamp": "2026-06-19T15:30:01.500Z"
  },
  {
    "url": "https://api.example.com/data",
    "method": "GET",
    "status": 404,
    "timestamp": "2026-06-19T15:30:02.000Z"
  },
  {
    "url": "https://api.example.com/submit",
    "method": "POST",
    "status": 500,
    "timestamp": "2026-06-19T15:30:03.000Z"
  }
]
```

Analyze failures:
```bash
cat sessions/latest/network.jsonl | jq 'select(.status >= 400)'
```

---

## AI Agent Workflows

### Example 7: Agent Tests a Web App

An AI agent uses DevTrace to test a web application:

```bash
# Agent starts observing
devtrace start

# Agent navigates to the app
# (agent-browser skill or similar)

# Agent triggers some action
# (click buttons, fill forms, etc.)

# Agent queries the API to check what happened
curl http://localhost:3333/latest | jq .
```

Agent logic:
```bash
# Check for errors
ERRORS=$(curl -s http://localhost:3333/latest | jq '.summary.consoleErrors')

if [ $ERRORS -gt 0 ]; then
  echo "Test failed: found $ERRORS errors"
  curl -s http://localhost:3333/latest/errors | jq .
else
  echo "Test passed: no errors"
fi
```

### Example 8: Agent Validates Form Submission

```bash
#!/bin/bash

echo "🤖 Agent testing form submission..."

# Start observing
devtrace start

# Wait for DevTrace to initialize
sleep 2

# Agent navigates to form
/agent-browser navigate https://example.com/form

# Agent fills out and submits form
/agent-browser fill-form "#email" "test@example.com"
/agent-browser fill-form "#password" "password123"
/agent-browser click "#submit"

# Wait for response
sleep 2

# Check results
FAILED_REQUESTS=$(curl -s http://localhost:3333/latest | jq '.summary.failedRequests')
LAST_ERROR=$(curl -s http://localhost:3333/latest | jq '.summary.lastError')

if [ "$LAST_ERROR" == "null" ] && [ "$FAILED_REQUESTS" == "0" ]; then
  echo "✅ Form submission successful"
else
  echo "❌ Form submission failed"
  echo "Errors: $LAST_ERROR"
  echo "Failed requests: $FAILED_REQUESTS"
fi
```

### Example 9: Agent Analyzes Page State

```bash
#!/bin/bash

# Start observing
devtrace start

# Agent navigates to page
/agent-browser navigate https://example.com/dashboard

# Agent waits for page to load
sleep 3

# Agent queries current page state
PAGE_STATE=$(curl -s http://localhost:3333/latest/page)

echo "Page Analysis:"
echo "$PAGE_STATE" | jq '.buttons[] | {text, id}'

# Extract specific information
BUTTONS=$(echo "$PAGE_STATE" | jq '.buttons | length')
echo "Found $BUTTONS buttons on the page"

# Check if expected elements exist
if echo "$PAGE_STATE" | jq -e '.buttons[] | select(.text == "Continue")' > /dev/null; then
  echo "✅ Continue button found"
else
  echo "❌ Continue button not found"
fi
```

---

## Integration with Testing

### Example 10: Use DevTrace in Test Suite

```bash
#!/bin/bash

# test-login.sh - Test login flow with DevTrace

set -e

TEST_URL="https://localhost:3000/login"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="password123"

echo "🧪 Testing login flow..."

# Start DevTrace
devtrace start > /tmp/devtrace.log 2>&1 &
DEVTRACE_PID=$!

# Wait for it to start
sleep 2

# Test 1: Navigate to login page
echo "  1. Navigating to $TEST_URL"
/agent-browser navigate "$TEST_URL"
sleep 1

# Test 2: Fill form
echo "  2. Entering credentials"
/agent-browser fill-form "input[name=email]" "$TEST_EMAIL"
/agent-browser fill-form "input[name=password]" "$TEST_PASSWORD"
sleep 0.5

# Test 3: Submit form
echo "  3. Submitting form"
/agent-browser click "button[type=submit]"
sleep 2

# Test 4: Verify results
echo "  4. Checking results..."

SESSION=$(curl -s http://localhost:3333/latest)
ERRORS=$(echo "$SESSION" | jq '.summary.consoleErrors')
FAILED=$(echo "$SESSION" | jq '.summary.failedRequests')
URL=$(echo "$SESSION" | jq -r '.activeUrl')

# Stop DevTrace
kill $DEVTRACE_PID

# Analyze results
echo ""
if [ "$ERRORS" == "0" ] && [ "$FAILED" == "0" ] && [[ "$URL" == *"dashboard"* ]]; then
  echo "✅ Login test PASSED"
  exit 0
else
  echo "❌ Login test FAILED"
  echo "  Errors: $ERRORS"
  echo "  Failed requests: $FAILED"
  echo "  Final URL: $URL"
  
  # Show what went wrong
  echo ""
  echo "Session details:"
  echo "$SESSION" | jq '.console[-5:] | reverse | .[] | {level, text}'
  
  exit 1
fi
```

Run the test:
```bash
bash test-login.sh
```

### Example 11: Compare Sessions

```bash
#!/bin/bash

# Compare two sessions to find what changed

SESSION1="2026-06-19-14-00-00"
SESSION2="2026-06-19-14-15-00"

echo "Comparing sessions..."
echo ""

echo "Session 1 ($SESSION1):"
cat sessions/$SESSION1/current-state.json | jq '.summary'

echo ""
echo "Session 2 ($SESSION2):"
cat sessions/$SESSION2/current-state.json | jq '.summary'

echo ""
echo "Differences:"

# Compare error counts
ERRORS1=$(cat sessions/$SESSION1/current-state.json | jq '.summary.consoleErrors')
ERRORS2=$(cat sessions/$SESSION2/current-state.json | jq '.summary.consoleErrors')

echo "  Errors: $ERRORS1 → $ERRORS2"

# Find new errors
echo ""
echo "Errors in session 2:"
comm -23 \
  <(cat sessions/$SESSION2/errors.jsonl | jq -r '.text' | sort) \
  <(cat sessions/$SESSION1/errors.jsonl | jq -r '.text' | sort)
```

---

## Advanced Examples

### Example 12: Extract Metrics

```bash
#!/bin/bash

# Extract metrics from a session

SESSION="latest"

echo "📊 Session Metrics:"
echo ""

# Count events
CONSOLE_EVENTS=$(wc -l < sessions/$SESSION/console.jsonl)
NETWORK_EVENTS=$(wc -l < sessions/$SESSION/network.jsonl)
ERROR_EVENTS=$(wc -l < sessions/$SESSION/errors.jsonl)

echo "Events captured:"
echo "  Console: $CONSOLE_EVENTS"
echo "  Network: $NETWORK_EVENTS"
echo "  Errors: $ERROR_EVENTS"

echo ""
echo "Error summary:"
cat sessions/$SESSION/current-state.json | jq '.summary'

echo ""
echo "Network status codes:"
cat sessions/$SESSION/network.jsonl | jq '.status' | sort | uniq -c

echo ""
echo "Slowest network requests:"
cat sessions/$SESSION/network.jsonl | jq -s 'sort_by(.timestamp) | reverse | .[0:3] | .[] | {url, method, status}'
```

### Example 13: Create a Session Report

```bash
#!/bin/bash

# Generate a markdown report from a session

SESSION="${1:-latest}"

cat > "sessions/$SESSION/REPORT.md" << EOF
# Session Report

Generated: $(date)
Session ID: $(cat sessions/$SESSION/current-state.json | jq -r '.sessionId')

## Summary

$(cat sessions/$SESSION/current-state.json | jq '"\(.summary | to_entries[] | "- \(.key): \(.value)")' -r)

## Console Messages

$(cat sessions/$SESSION/console.jsonl | jq -r '"- [\(.level)] \(.text)"')

## Network Requests

$(cat sessions/$SESSION/network.jsonl | jq -r '"- \(.status) \(.method) \(.url)"')

## Errors

$(cat sessions/$SESSION/errors.jsonl | jq -r '"- \(.text) (line \(.line))"')
EOF

echo "Report saved to sessions/$SESSION/REPORT.md"
```

---

## Tips & Tricks

### See what files were created
```bash
devtrace files
```

### View raw JSONL data
```bash
cat sessions/latest/console.jsonl | jq .
cat sessions/latest/network.jsonl | jq .
cat sessions/latest/errors.jsonl | jq .
```

### Search for specific errors
```bash
cat sessions/latest/errors.jsonl | jq 'select(.text | contains("undefined"))'
```

### Find failed network requests
```bash
cat sessions/latest/network.jsonl | jq 'select(.status >= 400)'
```

### Get page state as JSON
```bash
curl http://localhost:3333/latest/page | jq '.buttons[]'
```

### Export session to HTML
```bash
cat sessions/latest/current-state.json | jq . > session-export.json
```

---

## Related Documentation

- [README.md](./README.md) — Main documentation
- [QUICKSTART.md](./QUICKSTART.md) — Quick start guide
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) — Architecture details
- [SKILL.md](./.claude/skills/devtrace/SKILL.md) — Claude Code skill guide
