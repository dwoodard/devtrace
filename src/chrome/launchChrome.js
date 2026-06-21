import { launch } from 'chrome-launcher';
import { exec } from 'child_process';
import { promisify } from 'util';
import { findChromiumBinary } from '../utils/chromeUtils.js';

const execAsync = promisify(exec);

async function killExistingChrome() {
  try {
    await execAsync('pkill -f "Google Chrome"');
  } catch (err) {
    // No Chrome running is fine
  }
}

export async function launchChrome(port) {
  // Kill any existing Chrome processes to avoid conflicts
  await killExistingChrome();

  const chromePath = findChromiumBinary();
  if (!chromePath) {
    throw new Error('Chrome/Chromium not found. Install Chrome or Chromium.');
  }

  // Launch Chrome with debugging port only - Chrome will use its Default profile automatically
  const chrome = await launch({
    port,
    chromePath,
    chromeFlags: ['--no-sandbox'],
    startingUrl: 'about:blank',
  });

  return chrome;
}
