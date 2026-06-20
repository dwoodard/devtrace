import { sessionManager } from '../storage/sessionManager.js';
import { ChangeAnalyzer } from '../analyze/changeAnalyzer.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export async function inspectCommand(args) {
  const sessionId = args[0] || 'latest';
  const showChanges = args.includes('--changes');
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    console.error(chalk.red(`Session not found: ${sessionId}`));
    process.exit(1);
  }

  const stateFile = path.join(session.path, 'current-state.json');

  if (!fs.existsSync(stateFile)) {
    console.error(chalk.yellow(`No current state found. Is the observer running?`));
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));

  // Show smart changes if requested
  if (showChanges) {
    const analyzer = new ChangeAnalyzer(session.path);
    const changes = await analyzer.analyzeChanges();

    console.log(chalk.cyan(`\n📊 Key Changes in Session ${state.sessionId}\n`));

    if (changes.length === 0) {
      console.log(chalk.green('✓ No errors or failures detected\n'));
    } else {
      changes.forEach((change, index) => {
        const icon = change.severity === 'high' ? '✗' : change.type === 'navigation' ? '🔄' : '⚠';
        const color = change.severity === 'high' ? chalk.red : chalk.yellow;

        if (change.type === 'console-error') {
          console.log(color(`${index + 1}. ${icon} Console Error`));
          console.log(`   ${change.text.substring(0, 80)}...`);
        } else if (change.type === 'failed-request') {
          console.log(color(`${index + 1}. ${icon} Failed Request - ${change.method} ${change.status}`));
          console.log(`   ${change.url.substring(0, 80)}...`);
        } else if (change.type === 'navigation') {
          console.log(chalk.blue(`${index + 1}. ${icon} Navigated to ${change.url}`));
        }
        console.log();
      });
    }

    console.log(chalk.gray(`To see full summary: devtrace inspect ${sessionId}\n`));
    return;
  }

  // Original summary view
  console.log(chalk.cyan(`\n📊 Session: ${state.sessionId}\n`));
  console.log(chalk.blue(`URL: ${state.activeUrl}`));
  console.log(chalk.blue(`Title: ${state.title}`));
  console.log(chalk.blue(`Last navigation: ${state.lastNavigation}\n`));

  console.log(chalk.yellow(`Summary:`));
  console.log(`  Console errors: ${state.summary.consoleErrors}`);
  console.log(`  Console warnings: ${state.summary.consoleWarnings}`);
  console.log(`  Failed requests: ${state.summary.failedRequests}`);
  if (state.summary.lastError) {
    console.log(`  Last error: ${state.summary.lastError}`);
  }

  console.log(chalk.yellow(`\nRecent console messages:`));
  state.console.slice(-5).forEach((msg) => {
    const levelColor = msg.level === 'error' ? chalk.red : msg.level === 'warn' ? chalk.yellow : chalk.white;
    console.log(`  ${levelColor(msg.level)}: ${msg.text}`);
  });

  console.log(chalk.yellow(`\nRecent network requests:`));
  state.network.slice(-5).forEach((req) => {
    const statusColor = req.status >= 400 ? chalk.red : chalk.green;
    console.log(`  ${statusColor(req.status)} ${req.method} ${req.url}`);
  });

  console.log('\n');
}
