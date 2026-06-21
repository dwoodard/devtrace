import { launchChrome } from '../chrome/launchChrome.js';
import { sessionManager } from '../storage/sessionManager.js';
import { startLocalApi } from '../server/localApi.js';
import { observerLoop } from '../loop/observerLoop.js';
import chalk from 'chalk';
import { checkPort, findFreePort, killProcessOnPort } from '../utils/portUtils.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

// Load config from ~/.devtrace/config
function loadDevtraceConfig() {
  const configPath = path.join(os.homedir(), '.devtrace', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
      console.warn(chalk.yellow(`Warning: Could not parse ${configPath}`));
    }
  }
  return {};
}

const devtraceConfig = loadDevtraceConfig();
process.env.DEVTRACE_PORT = process.env.DEVTRACE_PORT || devtraceConfig.port;
process.env.DEVTRACE_API_PORT = process.env.DEVTRACE_API_PORT || devtraceConfig.apiPort;

function validatePort(port, name) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(chalk.red(`Invalid ${name}: ${port}. Port must be between 1 and 65535.`));
    process.exit(1);
  }
  return port;
}

async function checkChromeWithDebugging(port) {
  try {
    const response = await fetch(`http://localhost:${port}/json`, { timeout: 2000 });
    if (response.ok) {
      const targets = await response.json();
      return { found: true, targetCount: targets.length };
    }
  } catch (err) {
    // Chrome not responding on this port
  }
  return { found: false, targetCount: 0 };
}


export async function startCommand(args) {
  // Auto-spawn in background if running in TTY and not already backgrounded
  const showLogs = args.includes('--log');

  if (process.stdin.isTTY && !process.env.DEVTRACE_BACKGROUND && !showLogs) {
    const child = spawn(process.argv[0], process.argv.slice(1), {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, DEVTRACE_BACKGROUND: 'true' },
    });

    child.unref();

    console.log(chalk.green('✓ DevTrace started in background'));
    console.log(chalk.gray('  Run: devtrace status'));
    console.log(chalk.gray('  Run: devtrace see'));
    console.log(chalk.gray('  Run: devtrace stop\n'));
    process.exit(0);
  }

  let port = parseInt(process.env.DEVTRACE_PORT) || 9222;
  let apiPort = parseInt(process.env.DEVTRACE_API_PORT) || 3333;

  validatePort(port, 'Chrome DevTools port');
  validatePort(apiPort, 'API port');

  const autoPort = args.includes('--auto-port');
  const force = args.includes('--force');
  const useExisting = args.includes('--existing');
  let launchNew = !useExisting;

  console.log(chalk.cyan('\n🔍 DevTrace - Browser Observer\n'));

  // Check if Chrome is already running
  console.log('Checking for running Chrome...\n');
  let chromeIsRunning = await checkChromeWithDebugging(port);

  if (chromeIsRunning.found) {
    console.log(chalk.green(`✓ Found Chrome running on port ${port}`));
    console.log(chalk.yellow(`  Closing and relaunching with debugging enabled...\n`));
  } else {
    console.log(chalk.yellow(`✗ No Chrome detected on port ${port}\n`));
    if (!useExisting) {
      console.log(chalk.cyan('Will launch fresh Chrome...\n'));
    }
  }

  console.log(`Chrome DevTools Protocol: localhost:${port}`);
  console.log(`Local API: http://localhost:${apiPort}\n`);

  let apiPortAvailable = await checkPort(apiPort);
  let chromePortAvailable = useExisting ? true : await checkPort(port);

  // If launching new Chrome or force is enabled, kill processes on the ports
  if (launchNew || force) {
    if (!chromePortAvailable) {
      console.log(chalk.yellow(`Cleaning up Chrome on port ${port}...`));
      await killProcessOnPort(port);
      chromePortAvailable = true;
    }

    if (!apiPortAvailable) {
      console.log(chalk.yellow(`Cleaning up API server on port ${apiPort}...`));
      await killProcessOnPort(apiPort);
      apiPortAvailable = true;
    }
  }

  // If auto-port is enabled and ports are in use, find free ones
  if (autoPort && (!apiPortAvailable || !chromePortAvailable)) {
    console.log(chalk.yellow('Auto-port enabled, finding free ports...\n'));

    if (!chromePortAvailable) {
      const freePort = await findFreePort(port);
      if (freePort) {
        console.log(chalk.yellow(`  Chrome port ${port} → ${freePort}`));
        port = freePort;
        chromePortAvailable = true;
      }
    }

    if (!apiPortAvailable) {
      const freePort = await findFreePort(apiPort);
      if (freePort) {
        console.log(chalk.yellow(`  API port ${apiPort} → ${freePort}`));
        apiPort = freePort;
        apiPortAvailable = true;
      }
    }
  }

  if (!apiPortAvailable) {
    console.error(chalk.red(`\n❌ Error: Port ${apiPort} is already in use\n`));
    console.log(chalk.yellow('To fix this, try one of the following:\n'));
    console.log(chalk.cyan(`1. Kill the process using port ${apiPort}:`));
    console.log(`   lsof -i :${apiPort} | grep -v COMMAND | awk '{print $2}' | xargs kill -9\n`);
    console.log(chalk.cyan(`2. Or use a different API port:`));
    console.log(`   devtrace start 9222 3334\n`);
    console.log(chalk.cyan(`3. Or check what's using the port:`));
    console.log(`   lsof -i :${apiPort}\n`);
    process.exit(1);
  }

  if (!chromePortAvailable) {
    console.error(chalk.red(`\n❌ Error: Port ${port} is already in use\n`));
    console.log(chalk.yellow('This usually means Chrome is already running.\n'));
    console.log(chalk.cyan('To fix this:\n'));
    console.log(`1. Kill the existing Chrome process:`);
    console.log(`   pkill -f "chrome.*--remote-debugging-port=${port}"\n`);
    console.log(`2. Or use a different port:`);
    console.log(`   devtrace start 9223\n`);
    process.exit(1);
  }

  console.log(`Chrome DevTools Protocol: localhost:${port}`);
  console.log(`Local API: http://localhost:${apiPort}`);

  const session = sessionManager.createSession();
  console.log(chalk.blue(`Session: ${session.id}`));
  console.log(chalk.blue(`Storage: ${session.path}\n`));

  // Cleanup old sessions (keep last 50)
  sessionManager.cleanupOldSessions(50);

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nShutting down...\n'));
    process.exit(0);
  });

  try {
    let chrome = null;

    if (useExisting) {
      console.log(chalk.cyan('Connecting to existing Chrome browser...\n'));
      console.log(chalk.blue('If Chrome is not already running, start it in a new terminal:\n'));
      console.log(chalk.gray(`  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\ --remote-debugging-port=${port}`));

      // Don't launch Chrome, just use the port
      chrome = { kill: async () => {} }; // Dummy object for cleanup
      console.log(chalk.green('✓ Ready to observe your Chrome browser\n'));
    } else {
      chrome = await launchChrome(port);
      console.log(chalk.green('✓ Chrome launched\n'));
    }

    const server = startLocalApi(apiPort, session);
    console.log(chalk.green(`✓ Local API running\n`));

    try {
      await observerLoop(chrome, session, port);
    } catch (err) {
      console.error(chalk.red(`Observer error: ${err.message}`));
      throw err;
    } finally {
      console.log(chalk.yellow('\n✓ Observer stopped\n'));
      console.log(chalk.blue(`Session data saved to: ${session.path}\n`));
      server.close();
      await chrome.kill();
    }
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      const portNum = err.port;
      console.error(chalk.red(`\n❌ Error: Port ${portNum} is already in use\n`));
      console.log(chalk.yellow('To fix this:\n'));
      console.log(chalk.cyan(`1. Kill the process using port ${portNum}:`));
      console.log(`   lsof -i :${portNum} | grep -v COMMAND | awk '{print $2}' | xargs kill -9\n`);
      console.log(chalk.cyan(`2. Or use a different port:`));
      console.log(`   devtrace start ${port} ${portNum + 1}\n`);
    } else {
      console.error(chalk.red(`Error: ${err.message}`));
    }
    process.exit(1);
  }
}
