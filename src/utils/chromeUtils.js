import { execSync } from 'child_process';

export function findChromiumBinary() {
  const locations = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/opt/homebrew/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  for (const loc of locations) {
    try {
      execSync(`test -x "${loc}"`, { stdio: 'ignore' });
      return loc;
    } catch {
      continue;
    }
  }
  return null;
}
