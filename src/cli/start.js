import { launchChrome } from '../chrome/launchChrome.js';
import { sessionManager } from '../storage/sessionManager.js';
import { startLocalApi } from '../server/localApi.js';
import { observerLoop } from '../loop/observerLoop.js';
import chalk from 'chalk';
import { checkPort, findFreePort, killProcessOnPort } from '../utils/portUtils.js';

function validatePort(port, name) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(chalk.red(`Invalid ${name}: ${port}. Port must be between 1 and 65535.`));
    process.exit(1);
  }
  return port;
}

export async function startCommand(args) {
  let port = parseInt(args[0]) || 9222;
  let apiPort = parseInt(args[1]) || 3333;

  validatePort(port, 'Chrome DevTools port');
  validatePort(apiPort, 'API port');

  const autoPort = args.includes('--auto-port');
  const force = args.includes('--force');
  // Default to existing Chrome, use --new to launch a fresh instance
  const launchNew = args.includes('--new') || args.includes('--fresh');
  const useExisting = !launchNew; // Existing is now the default

  console.log(chalk.cyan('\n🔍 DevTrace - Browser Observer\n'));

  // If --existing flag is set, try to connect to existing Chrome
  if (useExisting) {
    console.log(chalk.yellow('Looking for existing Chrome browser...\n'));
    // We'll skip Chrome port checking since we're not launching our own
    console.log(`Chrome DevTools Protocol: localhost:${port}`);
    console.log(`Local API: http://localhost:${apiPort}\n`);
  } else {
    // Check if ports are available before launching
    console.log('Checking ports...');
  }

  let apiPortAvailable = await checkPort(apiPort);
  let chromePortAvailable = useExisting ? true : await checkPort(port);

  // If force is enabled and ports are in use, kill existing processes
  if (force && (!apiPortAvailable || !chromePortAvailable)) {
    console.log(chalk.yellow('Force mode enabled, killing existing processes...\n'));

    if (!chromePortAvailable) {
      console.log(chalk.yellow(`  Killing process on port ${port}...`));
      await killProcessOnPort(port);
      chromePortAvailable = true;
    }

    if (!apiPortAvailable) {
      console.log(chalk.yellow(`  Killing process on port ${apiPort}...`));
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
      console.log(chalk.gray('  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\'));
      console.log(chalk.gray(`    --remote-debugging-port=${port}\n`));
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
