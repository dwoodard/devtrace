import { sessionManager } from '../storage/sessionManager.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function cleanCommand(args) {
  const force = args.includes('--force');
  const sessions = sessionManager.listSessions();

  if (sessions.length === 0) {
    console.log(chalk.yellow('No sessions to clean\n'));
    return;
  }

  console.log(chalk.cyan(`Found ${sessions.length} session(s):\n`));
  sessions.slice(0, 5).forEach((sessionId) => {
    console.log(`  - ${sessionId}`);
  });

  if (sessions.length > 5) {
    console.log(`  ... and ${sessions.length - 5} more\n`);
  } else {
    console.log();
  }

  if (!force) {
    console.log(
      chalk.yellow(`Use --force to delete all sessions: devtrace clean --force\n`)
    );
    return;
  }

  // Delete all sessions
  const sessionsDir = path.join(os.homedir(), '.devtrace', 'sessions');

  try {
    for (const sessionId of sessions) {
      const sessionPath = path.join(sessionsDir, sessionId);
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    // Remove latest symlink if it exists
    const latestPath = path.join(sessionsDir, 'latest');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }

    console.log(chalk.green(`✓ Deleted ${sessions.length} session(s)\n`));
  } catch (err) {
    console.error(chalk.red(`Error deleting sessions: ${err.message}\n`));
    process.exit(1);
  }
}
