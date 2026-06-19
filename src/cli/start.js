import { launchChrome } from '../chrome/launchChrome.js';
import { sessionManager } from '../storage/sessionManager.js';
import { startLocalApi } from '../server/localApi.js';
import { observerLoop } from '../loop/observerLoop.js';
import chalk from 'chalk';

export async function startCommand(args) {
  const port = parseInt(args[0]) || 9222;
  const apiPort = parseInt(args[1]) || 3333;

  console.log(chalk.cyan('\n🔍 DevTrace - Browser Observer\n'));
  console.log(`Chrome DevTools Protocol: localhost:${port}`);
  console.log(`Local API: http://localhost:${apiPort}`);

  const session = sessionManager.createSession();
  console.log(chalk.blue(`Session: ${session.id}`));
  console.log(chalk.blue(`Storage: ${session.path}\n`));

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nShutting down...\n'));
    process.exit(0);
  });

  const chrome = await launchChrome(port);
  console.log(chalk.green('✓ Chrome launched\n'));

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
}
