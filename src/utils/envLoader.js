import fs from 'fs';
import path from 'path';
import os from 'os';

function expandPath(p) {
  if (!p) return p;
  return p.replace(/^~/, os.homedir());
}

export function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  const env = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          env[key.trim()] = expandPath(value);
        }
      }
    }
  }

  return env;
}

export function getEnv(key, defaultValue) {
  const env = loadEnv();
  return env[key] !== undefined ? env[key] : defaultValue;
}

export function writeEnv(config) {
  const envPath = path.join(process.cwd(), '.env');
  const lines = [];

  for (const [key, value] of Object.entries(config)) {
    if (value) {
      lines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
}
