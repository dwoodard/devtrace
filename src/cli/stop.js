import chalk from 'chalk';
import { killProcessOnPort, checkPort } from '../utils/portUtils.js';

export async function stopCommand(args) {
  let port = parseInt(args[0]) || 9222;
  let apiPort = parseInt(args[1]) || 3333;

  console.log(chalk.cyan('\n🛑 Stopping DevTrace\n'));

  let chromeStopped = false;
  let apiStopped = false;

  // Check if Chrome port is in use and kill it
  const chromeInUse = !(await checkPort(port));
  if (chromeInUse) {
    try {
      console.log(chalk.yellow(`Stopping Chrome DevTools on port ${port}...`));
      chromeStopped = await killProcessOnPort(port);
      if (chromeStopped) {
        console.log(chalk.green(`✓ Stopped Chrome on port ${port}`));
      } else {
        console.log(chalk.gray(`  No process found on port ${port}`));
      }
    } catch (err) {
      console.error(chalk.red(`Failed to stop Chrome: ${err.message}`));
    }
  } else {
    console.log(chalk.gray(`  Port ${port} is not in use`));
  }

  // Check if API port is in use and kill it
  const apiInUse = !(await checkPort(apiPort));
  if (apiInUse) {
    try {
      console.log(chalk.yellow(`Stopping API on port ${apiPort}...`));
      apiStopped = await killProcessOnPort(apiPort);
      if (apiStopped) {
        console.log(chalk.green(`✓ Stopped API on port ${apiPort}`));
      } else {
        console.log(chalk.gray(`  No process found on port ${apiPort}`));
      }
    } catch (err) {
      console.error(chalk.red(`Failed to stop API: ${err.message}`));
    }
  } else {
    console.log(chalk.gray(`  Port ${apiPort} is not in use`));
  }

  console.log(chalk.cyan('\n'));

  if (!chromeStopped && !apiStopped) {
    console.log(chalk.yellow('No DevTrace processes running'));
    process.exit(0);
  }

  console.log(chalk.green('✓ DevTrace stopped\n'));
  process.exit(0);
}
