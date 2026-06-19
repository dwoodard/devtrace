import { launch } from 'chrome-launcher';
import path from 'path';
import os from 'os';
import fs from 'fs';

const homeDir = os.homedir();
const profileDir = path.join(homeDir, 'projects/devtrace/.chrome-profile');

export async function launchChrome(port) {
  // Ensure profile directory exists
  fs.mkdirSync(profileDir, { recursive: true });

  const chrome = await launch({
    port,
    userDataDir: profileDir,
    chromeFlags: ['--no-sandbox'],
    startingUrl: 'about:blank',
  });

  return chrome;
}
