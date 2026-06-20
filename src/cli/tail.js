import { sessionManager } from '../storage/sessionManager.js';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';

export async function tailCommand(args) {
  const type = args[0]; // 'console', 'network', or undefined for both
  const sessionId = 'latest';
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    console.error(chalk.red(`No session found`));
    process.exit(1);
  }

  // Validate type if provided
  if (type && type !== 'console' && type !== 'network') {
    console.error(chalk.red(`Error: Invalid type '${type}'\n`));
    console.log(chalk.yellow(`Usage: devtrace tail [console|network]\n`));
    console.log('Examples:');
    console.log('  devtrace tail              Follow all events (console + network)');
    console.log('  devtrace tail console      Follow console logs only');
    console.log('  devtrace tail network      Follow network requests only\n');
    console.log('For detailed help: devtrace tail -h');
    process.exit(1);
  }

  const types = type ? [type] : ['console', 'network'];
  const displayName = type || 'all events';

  const filePaths = {};
  for (const t of types) {
    const filename = `${t}.jsonl`;
    filePaths[t] = path.join(session.path, filename);
  }

  const existsAny = Object.values(filePaths).some(fp => fs.existsSync(fp));
  if (!existsAny) {
    console.log(chalk.yellow(`Waiting for first ${displayName}...`));
  }

  console.log(chalk.cyan(`\n📡 Following ${displayName} (Ctrl+C to exit)\n`));

  const lastSizes = {};
  for (const t of types) {
    lastSizes[t] = 0;
  }

  const pollFiles = () => {
    for (const t of types) {
      const filepath = filePaths[t];
      try {
        const stats = fs.statSync(filepath);
        if (stats.size > lastSizes[t]) {
          const stream = fs.createReadStream(filepath, { start: lastSizes[t] });
          const rl = readline.createInterface({ input: stream });

          rl.on('line', (line) => {
            if (line.trim()) {
              const event = JSON.parse(line);
              printEvent(t, event);
            }
          });

          rl.on('close', () => {
            lastSizes[t] = stats.size;
          });
        }
      } catch (err) {
        // File doesn't exist yet
      }
    }

    setTimeout(pollFiles, 500);
  };

  pollFiles();
}

function printEvent(type, event) {
  if (type === 'console') {
    const levelColor = event.level === 'error' ? chalk.red : event.level === 'warn' ? chalk.yellow : chalk.white;
    console.log(`${levelColor(event.level)}: ${event.text}`);
  } else if (type === 'network') {
    const statusColor = event.status >= 400 ? chalk.red : chalk.green;
    console.log(`${statusColor(event.status)} ${event.method} ${event.url}`);
  }
}
