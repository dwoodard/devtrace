import { launch } from 'chrome-launcher';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { findChromiumBinary } from '../utils/chromeUtils.js';

const homeDir = os.homedir();
const profileDir = path.join(homeDir, 'projects/devtrace/.chrome-profile');

export async function launchChrome(port) {
  // Ensure profile directory exists
  fs.mkdirSync(profileDir, { recursive: true });

  const chromePath = findChromiumBinary();
  if (!chromePath) {
    throw new Error('Chrome/Chromium not found. Install Chrome or Chromium.');
  }

  const chrome = await launch({
    port,
    userDataDir: profileDir,
    chromePath,
    chromeFlags: ['--no-sandbox'],
    startingUrl: 'about:blank',
  });

  return chrome;
}
