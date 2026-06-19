import { startCommand } from './start.js';
import { openCommand } from './open.js';
import { inspectCommand } from './inspect.js';
import { tailCommand } from './tail.js';
import { skillCommand } from './skill.js';

const command = process.argv[2];
const args = process.argv.slice(3);

(async () => {
  try {
    switch (command) {
      case 'start':
        await startCommand(args);
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
      case 'help':
      case '-h':
      case '--help':
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
  console.log(`
DevTrace - Local browser observation tool

Usage:
  devtrace start          Launch Chrome and start observing
  devtrace open          Open the latest session in a browser
  devtrace inspect latest Inspect the latest session state
  devtrace tail console  Follow console logs in real-time
  devtrace tail network  Follow network requests in real-time
  devtrace skill install  Install the Claude skill
  devtrace skill status   Check skill installation status
  devtrace skill help     Show skill information
  devtrace help          Show this help message

Sessions are stored in ./sessions/
Skill location: ./.claude/skills/devtrace
  `);
}
