# Using DevTrace with Chrome

DevTrace can work in two ways:

1. **Launch a new Chrome instance** (default)
2. **Connect to your existing Chrome browser** (new feature)

## Option 1: Default - Launch New Chrome

DevTrace launches a fresh Chrome instance with debugging enabled.

```bash
devtrace start
```

**Pros:**
- ✅ Simple, one command
- ✅ Isolated from your normal browsing
- ✅ No need to configure anything
- ✅ Perfect for automated testing

**Cons:**
- ❌ Separate browser window
- ❌ Can't use your existing tabs/history
- ❌ Extensions are disabled

## Option 2: Connect to Existing Chrome

Use your normal Chrome browser with DevTrace monitoring.

### Step 1: Enable Remote Debugging on Your Chrome

Close Chrome completely, then start it with the debugging flag:

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222
```

**Linux:**
```bash
google-chrome --remote-debugging-port=9222
```

**Windows:**
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

### Step 2: Start DevTrace

In another terminal, start DevTrace with the `--existing` flag:

```bash
devtrace start --existing
```

**Pros:**
- ✅ Use your normal Chrome browser
- ✅ Keep your extensions, history, bookmarks
- ✅ All your open tabs are monitored
- ✅ Exactly what you're doing in real-time

**Cons:**
- ❌ Requires starting Chrome manually with a flag
- ❌ Chrome won't shut down with DevTrace
- ❌ Need to enable debugging port

## Complete Workflow: Using Existing Chrome

```bash
# Terminal 1: Start Chrome with debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222

# Terminal 2: Connect DevTrace
devtrace start --existing

# Terminal 3 (optional): Monitor in real-time
devtrace tail console
```

Now open any website in Chrome and DevTrace will capture everything!

## What Gets Captured

DevTrace monitors all tabs and windows in the connected Chrome browser:

- **Console logs, warnings, errors** — All console output from all tabs
- **Network requests** — Every HTTP/HTTPS request and response
- **JavaScript errors** — Uncaught exceptions and runtime errors
- **Page state** — URLs, titles, buttons, links, forms
- **Multiple tabs** — All tabs are observed simultaneously

## Example: Debug Your Own Website

```bash
# Terminal 1: Start Chrome with debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 &

# Terminal 2: Start DevTrace
devtrace start --existing

# Terminal 3: Open your website and interact with it
# (In Chrome: navigate to localhost:3000 or your dev server)

# Terminal 4: While interacting, monitor in real-time
devtrace tail console

# Check results later
devtrace inspect latest
cat sessions/latest/console.jsonl | jq .
```

## Custom Port

If port 9222 is already in use:

```bash
# Start Chrome with different port
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9223

# Connect DevTrace to that port
devtrace start 9223 --existing
```

## Troubleshooting

### "Chrome not responding" or "No targets found"

Make sure Chrome is running with the `--remote-debugging-port` flag:

```bash
# Check if Chrome is running with debugging enabled
lsof -i :9222
```

You should see Chrome in the output. If not, start Chrome with the flag.

### "Connection refused"

DevTrace can't connect to the debugging port. Check:

1. Is Chrome running with `--remote-debugging-port=9222`?
2. Is another process using port 9222? Try a different port:
   ```bash
   devtrace start 9223 --existing
   ```

### Chrome closes when DevTrace stops

This is expected if you're using `--existing`. Chrome continues running after DevTrace exits.

## Flags You Can Combine

```bash
# Use existing Chrome with different port
devtrace start 9223 --existing

# Use existing Chrome and auto-find free API port
devtrace start 9222 3334 --existing --auto-port

# Everything works together!
devtrace start 9223 3334 --existing --force --auto-port
```

## When to Use Which

**Use default (new Chrome):**
- Running automated tests
- CI/CD pipelines
- Isolated debugging
- Don't need your normal extensions

**Use --existing:**
- Debugging your real workflow
- Testing with your actual extensions
- Monitoring multiple tabs at once
- Working with saved cookies/logins
- Real-world user behavior simulation

## Capture Everything Automatically

Once DevTrace is connected, everything is captured automatically:

1. **Navigate anywhere** — All navigation events recorded
2. **Open multiple tabs** — All tabs monitored simultaneously
3. **Run JavaScript** — Console output captured
4. **Make network requests** — All requests tracked
5. **Get errors** — JavaScript exceptions logged
6. **View results** — Query the API or inspect files

## API While Monitoring

While DevTrace is running, you can query the current state:

```bash
# Get everything
curl http://localhost:3333/latest | jq .

# Just console messages
curl http://localhost:3333/latest/console | jq .

# Just network requests
curl http://localhost:3333/latest/network | jq .

# Page elements
curl http://localhost:3333/latest/page | jq '.buttons[]'
```

## Related Documentation

- [README.md](./README.md) — Full documentation
- [EXAMPLES.md](./EXAMPLES.md) — Real-world usage examples
- [QUICKSTART.md](./QUICKSTART.md) — Quick start guide
