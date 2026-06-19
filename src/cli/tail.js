import { sessionManager } from '../storage/sessionManager.js';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';

export async function tailCommand(args) {
  const type = args[0]; // 'console' or 'network'
  const sessionId = 'latest';
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    console.error(chalk.red(`No session found`));
    process.exit(1);
  }

  const filename = `${type}.jsonl`;
  const filepath = path.join(session.path, filename);

  if (!fs.existsSync(filepath)) {
    console.log(chalk.yellow(`Waiting for first ${type} events...`));
  }

  console.log(chalk.cyan(`\n📡 Following ${type} events (Ctrl+C to exit)\n`));

  let lastSize = 0;

  const pollFile = () => {
    try {
      const stats = fs.statSync(filepath);
      if (stats.size > lastSize) {
        const stream = fs.createReadStream(filepath, { start: lastSize });
        const rl = readline.createInterface({ input: stream });

        rl.on('line', (line) => {
          if (line.trim()) {
            const event = JSON.parse(line);
            printEvent(type, event);
          }
        });

        rl.on('close', () => {
          lastSize = stats.size;
        });
      }
    } catch (err) {
      // File doesn't exist yet
    }

    setTimeout(pollFile, 500);
  };

  pollFile();
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
