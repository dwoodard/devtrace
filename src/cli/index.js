import { startCommand } from './start.js';
import { stopCommand } from './stop.js';
import { openCommand } from './open.js';
import { inspectCommand } from './inspect.js';
import { tailCommand } from './tail.js';
import { skillCommand } from './skill.js';
import { setupCommand } from './setup.js';

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const command = process.argv[2];
const args = process.argv.slice(3);

const commandHelp = {
  setup: `devtrace setup - Configure DevTrace (interactive walkthrough)

Description:
  Runs an interactive setup wizard to configure DevTrace for your environment.
  Sets up the Chrome DevTools Protocol connection and initializes the API server.

Usage:
  devtrace setup

The setup wizard will guide you through:
  - Chrome browser detection
  - Port configuration
  - DevTools Protocol setup`,

  start: `devtrace start - Start DevTrace and connect to Chrome

Description:
  Starts the DevTrace service and connects to your Chrome browser instance.
  Captures console logs, network requests, and page state.

Usage:
  devtrace start [options]

Options:
  --new              Launch a new Chrome instance instead of using existing
  --force            Kill any existing processes and start fresh
  --auto-port        Auto-detect free ports if defaults are taken
  [port] [port]      Use custom Chrome DevTools port and API server port
                     Default: 9222 3333

Examples:
  devtrace start                    Connect to existing Chrome
  devtrace start --new              Launch a new Chrome instance
  devtrace start 9223               Use custom DevTools port
  devtrace start 9223 3334          Use custom ports for DevTools and API
  devtrace start --force            Kill existing and restart fresh`,

  stop: `devtrace stop - Stop the DevTrace service

Description:
  Stops the running DevTrace service and cleans up connections.

Usage:
  devtrace stop [options]

Options:
  [port] [port]      Stop service on custom ports
                     Default: 9222 3333

Examples:
  devtrace stop                     Stop default service
  devtrace stop 9223 3334           Stop custom port service`,

  open: `devtrace open - Open the latest session in browser

Description:
  Opens your default browser and displays the latest recorded DevTrace session.
  Shows captured console logs, network requests, and page state.

Usage:
  devtrace open

The session viewer allows you to:
  - Browse captured network requests
  - View console logs and errors
  - Inspect page state snapshots
  - Export session data`,

  inspect: `devtrace inspect - Inspect session state

Description:
  Displays detailed metadata and state information about a recorded session.

Usage:
  devtrace inspect [session]

Arguments:
  [session]          Session identifier or 'latest' for most recent
                     Default: latest

Examples:
  devtrace inspect latest           Show latest session details
  devtrace inspect 1234567890       Show specific session details`,

  tail: `devtrace tail - Follow real-time browser logs

Description:
  Streams real-time logs from your connected Chrome browser to the terminal.
  Shows events as they happen while you interact with your app.

Usage:
  devtrace tail [type]

Arguments:
  [type]             Optional: 'console' or 'network'
                     If omitted, shows both console and network events

Types:
  console            All browser console output (logs, warnings, errors)
  network            All HTTP requests (APIs, resources, failures)

What Gets Captured:
  console:
    • console.log(), console.warn(), console.error() messages
    • JavaScript exceptions and stack traces
    • Extension console output

  network:
    • API calls from your application
    • Page resource loads (images, scripts, stylesheets)
    • Background requests and webhooks
    • Failed requests with status/error details
    • Requests from extensions or content scripts

Output Format:
  console:  [level] message text
            Example: error: Cannot read properties of undefined

  network:  [STATUS] METHOD URL
            Example: 200 GET https://api.example.com/users
            Example: 404 POST https://api.example.com/missing-endpoint

When Data Appears:
  • Events stream in real-time as they occur in Chrome
  • Network: when response is received or request fails
  • Console: immediately when logged or error occurs
  • Updates checked every 500ms

Examples:
  devtrace tail                     Follow all events (console + network)
  devtrace tail console             Watch console output while you interact
  devtrace tail network             See all API calls and resource loads

Use Cases:
  • Debugging issues (see console errors + API failures together)
  • Verifying API responses and request payloads
  • Catching console errors and network problems as they happen
  • Tracking background processes and webhooks`,

  skill: `devtrace skill - Manage Claude DevTrace skill

Description:
  Install and manage the DevTrace skill for Claude Code integration.

Usage:
  devtrace skill [action]

Actions:
  install            Install the Claude skill
  status             Check installation status
  help               Show skill help

Examples:
  devtrace skill install            Install the skill
  devtrace skill status             Check if installed
  devtrace skill help               Show skill documentation`
};

(async () => {
  try {
    // Check for help flag
    if (args[0] === '-h' || args[0] === '--help') {
      if (commandHelp[command]) {
        console.log(commandHelp[command]);
      } else {
        console.log(`No help available for: ${command}`);
      }
      process.exit(0);
    }

    switch (command) {
      case 'start':
        await startCommand(args);
        break;
      case 'stop':
        await stopCommand(args);
        break;
      case 'open':
        await openCommand(args);
        break;
      case 'inspect':
        await inspectCommand(args);
        break;
      case 'tail':
        await tailCommand(args);
        break;
      case 'skill':
        await skillCommand(args);
        break;
      case 'setup':
        await setupCommand();
        break;
      case 'help':
      case '-h':
      case '--help':
      case undefined:
        printMinimalHelp();
        process.exit(0);
        break;
      default:
        console.log(`Unknown command: ${command}`);
        printMinimalHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

function printMinimalHelp() {
  console.log(`Usage: devtrace [cmd] [options]

  devtrace setup                        Configure DevTrace (interactive walkthrough)
  devtrace start [options]              Start DevTrace (--new, --force, --auto-port, ports)
  devtrace stop [ports]                 Stop the running DevTrace service
  devtrace open                         Open the latest session in a browser
  devtrace inspect [session]            Inspect session state
  devtrace tail [console|network]       Follow logs in real-time
  devtrace skill [install|status|help]  Manage Claude skill
  devtrace help [cmd]                   Show detailed help`);
}
