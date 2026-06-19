import { sessionManager } from '../storage/sessionManager.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export async function openCommand(args) {
  const sessionId = args[0] || 'latest';
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    console.error(chalk.red(`Session not found: ${sessionId}`));
    process.exit(1);
  }

  const url = `http://localhost:3333/latest`;
  console.log(chalk.cyan(`Opening ${url} in browser...`));

  try {
    await execAsync(`open "${url}"`);
  } catch (err) {
    console.error(chalk.red(`Could not open browser: ${err.message}`));
  }
}
