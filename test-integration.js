import { spawn } from 'child_process';
import { CDPClient } from './src/chrome/attachToTarget.js';
import { discoverTargets } from './src/chrome/discoverTargets.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findPageTarget(port) {
  for (let i = 0; i < 10; i++) {
    try {
      const targets = await discoverTargets(port);
      const pageTarget = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTarget) {
        return pageTarget;
      }
    } catch (err) {
      // Ignore errors and retry
    }
    await sleep(500);
  }
  throw new Error('No page target found');
}

async function runIntegrationTest() {
  console.log('🧪 Starting integration test...\n');

  // Clean up
  const sessionsDir = path.join(__dirname, 'sessions');
  const latestPath = path.join(sessionsDir, 'latest');
  if (fs.existsSync(latestPath)) {
    const realPath = fs.realpathSync(latestPath);
    fs.rmSync(realPath, { recursive: true, force: true });
    fs.unlinkSync(latestPath);
  }

  // Start devtrace
  console.log('Starting devtrace...');
  const devtrace = spawn('node', ['bin/devtrace', 'start'], {
    cwd: __dirname,
    stdio: 'pipe',
  });

  await sleep(3000);

  try {
    // Find the page target
    console.log('Finding Chrome target...');
    const target = await findPageTarget(9222);
    console.log(`✓ Found target: ${target.title || target.url}\n`);

    // Connect to the target
    console.log('Connecting to target via CDP...');
    const client = new CDPClient(target.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Runtime.enable');
    console.log('✓ Connected\n');

    // Execute console commands
    console.log('Executing console commands...');
    await client.send('Runtime.evaluate', {
      expression: "console.log('hello from devtrace')",
    });
    await client.send('Runtime.evaluate', {
      expression: "console.error('test error from devtrace')",
    });
    console.log('✓ Commands executed\n');

    // Wait for events to be written
    await sleep(2000);

    // Check console.jsonl
    const consoleFile = path.join(sessionsDir, 'latest', 'console.jsonl');
    if (!fs.existsSync(consoleFile)) {
      throw new Error('console.jsonl not found');
    }

    const consoleLines = fs.readFileSync(consoleFile, 'utf-8').trim().split('\n');
    const consoleEvents = consoleLines
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    console.log(`📄 console.jsonl has ${consoleEvents.length} events:\n`);
    consoleEvents.forEach((event) => {
      console.log(`  [${event.level}] ${event.text}`);
    });

    const hasLog = consoleEvents.some((e) => e.text.includes('hello from devtrace'));
    const hasError = consoleEvents.some((e) => e.text.includes('test error from devtrace'));

    if (!hasLog || !hasError) {
      throw new Error('Expected console messages not found');
    }

    console.log('\n✓ Console messages captured correctly\n');

    // Check current-state.json
    const stateFile = path.join(sessionsDir, 'latest', 'current-state.json');
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));

    console.log('📊 current-state.json:');
    console.log(`  URL: ${state.activeUrl}`);
    console.log(`  Title: ${state.title}`);
    console.log(`  Console errors: ${state.summary.consoleErrors}`);
    console.log(`  Console messages: ${state.console.length}\n`);

    const stateHasLog = state.console.some((m) => m.text.includes('hello from devtrace'));
    const stateHasError = state.console.some((m) => m.text.includes('test error from devtrace'));

    if (!stateHasLog || !stateHasError) {
      throw new Error('Expected console messages not in current-state.json');
    }

    console.log('✓ current-state.json has expected messages\n');

    await client.close();
  } finally {
    // Stop devtrace
    try {
      devtrace.kill('SIGTERM');
    } catch (err) {
      // Ignore
    }
    await sleep(1000);
  }

  console.log('✅ Integration test passed!\n');
}

runIntegrationTest()
  .catch((err) => {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
