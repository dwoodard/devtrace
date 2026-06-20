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

(async () => {
  try {
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
        printHelp();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

function printHelp() {
  console.log(`Usage:
  devtrace setup              Configure DevTrace (interactive walkthrough)
  devtrace start              Start DevTrace (supports --new, --force, --auto-port, custom ports)
  devtrace stop               Stop the running DevTrace service
  devtrace open              Open the latest session in a browser
  devtrace inspect            Inspect session state
  devtrace tail               Follow console or network logs in real-time
  devtrace skill              Manage Claude skill (install, status, help)
  devtrace help               Show this help message`);
}
