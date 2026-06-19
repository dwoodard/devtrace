#!/bin/bash

# DevTrace Skill Helper - Extended commands for /devtrace

DEVTRACE_DIR="/Users/dustin/projects/devtrace"
SESSIONS_DIR="$DEVTRACE_DIR/sessions"

command=$1
shift

case "$command" in
  start)
    cd "$DEVTRACE_DIR"
    echo "🚀 Starting DevTrace..."
    devtrace start
    ;;

  stop)
    echo "Stopping DevTrace..."
    pkill -f "devtrace start" || echo "DevTrace not running"
    ;;

  status)
    if pgrep -f "devtrace start" > /dev/null; then
      echo "✅ DevTrace is running"
      echo "Session: $(ls -1d $SESSIONS_DIR/latest 2>/dev/null | xargs -I {} realpath {} | xargs -I {} basename {})"
      echo "API: http://localhost:3333"
    else
      echo "❌ DevTrace is not running"
    fi
    ;;

  inspect)
    cd "$DEVTRACE_DIR"
    devtrace inspect latest
    ;;

  console)
    if [ -f "$SESSIONS_DIR/latest/console.jsonl" ]; then
      echo "📝 Recent console messages:"
      tail -n 10 "$SESSIONS_DIR/latest/console.jsonl" | jq -s 'map({level, text, timestamp})'
    else
      echo "No console data found. Is DevTrace running?"
    fi
    ;;

  network)
    if [ -f "$SESSIONS_DIR/latest/network.jsonl" ]; then
      echo "🌐 Recent network requests:"
      tail -n 10 "$SESSIONS_DIR/latest/network.jsonl" | jq -s 'map({method, url, status, timestamp})'
    else
      echo "No network data found. Is DevTrace running?"
    fi
    ;;

  api)
    echo "📡 Querying API at http://localhost:3333/latest..."
    if curl -s http://localhost:3333/health > /dev/null 2>&1; then
      curl -s http://localhost:3333/latest | jq .
    else
      echo "API not responding. Is DevTrace running?"
      echo "Start with: devtrace start"
    fi
    ;;

  files)
    if [ -d "$SESSIONS_DIR/latest" ]; then
      echo "📁 Session files:"
      ls -lh "$SESSIONS_DIR/latest/" | tail -n +2
      echo ""
      echo "Session path: $(realpath $SESSIONS_DIR/latest)"
    else
      echo "No session found. Is DevTrace running?"
    fi
    ;;

  tail-console)
    cd "$DEVTRACE_DIR"
    devtrace tail console
    ;;

  tail-network)
    cd "$DEVTRACE_DIR"
    devtrace tail network
    ;;

  logs)
    if [ -f "$SESSIONS_DIR/latest/current-state.json" ]; then
      jq . "$SESSIONS_DIR/latest/current-state.json"
    else
      echo "No session data found."
    fi
    ;;

  help)
    cat << 'EOF'
DevTrace Commands:

  /devtrace start          Launch Chrome and start observing
  /devtrace stop           Stop the current session
  /devtrace status         Check if DevTrace is running
  /devtrace inspect        View session summary
  /devtrace console        Show recent console messages
  /devtrace network        Show recent network requests
  /devtrace api            Query the local API
  /devtrace files          Show session files
  /devtrace tail-console   Follow console messages live
  /devtrace tail-network   Follow network requests live
  /devtrace logs           Show full session state (JSON)
  /devtrace help           Show this message

For more info: cat /Users/dustin/projects/devtrace/QUICKSTART.md
EOF
    ;;

  *)
    echo "Unknown command: $command"
    echo "Run: /devtrace help"
    exit 1
    ;;
esac
