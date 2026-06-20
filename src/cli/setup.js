import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadEnv, writeEnv } from '../utils/envLoader.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

export async function setupCommand() {
  console.log(chalk.cyan('\n🔧 DevTrace Setup Walkthrough\n'));

  const existingEnv = loadEnv();
  const config = { ...existingEnv };

  console.log(chalk.yellow('This will configure DevTrace for your system.\n'));

  // Chrome Profile
  console.log(chalk.blue('1. Chrome Profile Path'));
  console.log(chalk.gray('   Your Chrome extensions and preferences will be available.\n'));

  const defaultProfile = `${os.homedir()}/Library/Application Support/Google/Chrome/Default`;
  const currentProfile = config.DEVTRACE_CHROME_PROFILE || defaultProfile;

  console.log(chalk.gray(`   Current: ${currentProfile}`));
  const useDefault = await question(chalk.cyan('   Use your default Chrome profile? (Y/n): '));

  if (useDefault.toLowerCase() !== 'n') {
    config.DEVTRACE_CHROME_PROFILE = defaultProfile;
    console.log(chalk.green(`   ✓ Using default Chrome profile\n`));
  } else {
    const customPath = await question(chalk.cyan('   Enter Chrome profile path: '));
    if (customPath.trim()) {
      config.DEVTRACE_CHROME_PROFILE = customPath.trim();
      console.log(chalk.green(`   ✓ Using custom profile\n`));
    } else {
      delete config.DEVTRACE_CHROME_PROFILE;
      console.log(chalk.yellow(`   ✓ Using temporary profile (no extensions)\n`));
    }
  }

  // Chrome DevTools Port
  console.log(chalk.blue('2. Chrome DevTools Port'));
  console.log(chalk.gray('   This is the port Chrome uses for remote debugging.\n'));

  const currentPort = config.DEVTRACE_PORT || '9222';
  console.log(chalk.gray(`   Current: ${currentPort}`));
  const useDefaultPort = await question(chalk.cyan('   Use default port 9222? (Y/n): '));

  if (useDefaultPort.toLowerCase() !== 'n') {
    config.DEVTRACE_PORT = '9222';
    console.log(chalk.green(`   ✓ Using port 9222\n`));
  } else {
    const customPort = await question(chalk.cyan('   Enter Chrome DevTools port: '));
    if (customPort.trim()) {
      config.DEVTRACE_PORT = customPort.trim();
      console.log(chalk.green(`   ✓ Using port ${customPort}\n`));
    }
  }

  // API Port
  console.log(chalk.blue('3. Local API Port'));
  console.log(chalk.gray('   DevTrace will serve the observation API on this port.\n'));

  const currentApiPort = config.DEVTRACE_API_PORT || '3333';
  console.log(chalk.gray(`   Current: ${currentApiPort}`));
  const useDefaultApiPort = await question(chalk.cyan('   Use default port 3333? (Y/n): '));

  if (useDefaultApiPort.toLowerCase() !== 'n') {
    config.DEVTRACE_API_PORT = '3333';
    console.log(chalk.green(`   ✓ Using port 3333\n`));
  } else {
    const customApiPort = await question(chalk.cyan('   Enter API port: '));
    if (customApiPort.trim()) {
      config.DEVTRACE_API_PORT = customApiPort.trim();
      console.log(chalk.green(`   ✓ Using port ${customApiPort}\n`));
    }
  }

  // Confirm and save
  console.log(chalk.yellow('\n📝 Configuration Summary:\n'));
  console.log(chalk.gray(`  Chrome Profile: ${config.DEVTRACE_CHROME_PROFILE || '(temporary)'}`));
  console.log(chalk.gray(`  Chrome Port: ${config.DEVTRACE_PORT || '9222'}`));
  console.log(chalk.gray(`  API Port: ${config.DEVTRACE_API_PORT || '3333'}`));

  const confirm = await question(chalk.cyan('\n  Save this configuration? (Y/n): '));

  if (confirm.toLowerCase() !== 'n') {
    writeEnv(config);
    console.log(chalk.green('\n✓ Configuration saved to .env\n'));
    console.log(chalk.cyan('You can now run:'));
    console.log(chalk.gray('  devtrace start\n'));
  } else {
    console.log(chalk.yellow('\n✗ Setup cancelled\n'));
  }

  rl.close();
}
