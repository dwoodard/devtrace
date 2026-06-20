import chalk from 'chalk';
import http from 'http';

export async function statusCommand(args) {
  let port = parseInt(args[0]) || 9222;
  let apiPort = parseInt(args[1]) || 3333;

  console.log(chalk.cyan('\n📊 DevTrace Status\n'));

  const chromeRunning = await testService('Chrome', port, 'http://localhost:' + port + '/json');
  const apiRunning = await testService('API', apiPort, 'http://localhost:' + apiPort + '/sessions');

  console.log(`Chrome DevTools Protocol (port ${port}): ${chromeRunning ? chalk.green('✓ Running') : chalk.gray('✗ Not running')
    }`);
  console.log(`API Server (port ${apiPort}): ${apiRunning ? chalk.green('✓ Running') : chalk.gray('✗ Not running')
    }`);

  const overallStatus = chromeRunning && apiRunning;
  console.log(
    `\nOverall Status: ${overallStatus ? chalk.green('✓ DevTrace is running') : chalk.yellow('⚠ DevTrace is not running')
    }\n`
  );

  if (overallStatus) {
    console.log(chalk.gray('To stop: devtrace stop'));
  } else {
    console.log(chalk.gray('To start: devtrace start --new &'));
  }

  console.log(chalk.cyan(''));
  process.exit(0);
}

async function testService(name, port, url) {
  return new Promise((resolve) => {
    http.get(url, { timeout: 1000 }, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        resolve(true);
      });
    }).on('error', () => {
      resolve(false);
    });
  });
}
