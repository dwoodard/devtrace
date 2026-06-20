import { launch } from 'chrome-launcher';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { findChromiumBinary } from '../utils/chromeUtils.js';
import { getEnv } from '../utils/envLoader.js';

export async function launchChrome(port) {
  const homeDir = os.homedir();

  // Get profile from .env or use default temp profile
  let profileDir = getEnv('DEVTRACE_CHROME_PROFILE');

  if (!profileDir) {
    // Use temporary profile if not configured
    profileDir = path.join(homeDir, 'projects/devtrace/.chrome-profile');
  }

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
