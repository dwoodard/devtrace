import { sessionManager } from '../storage/sessionManager.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export async function seeCommand(args) {
  // Parse arguments
  const options = parseArgs(args);
  const sessionId = 'latest';
  const session = sessionManager.getSession(sessionId);

  if (!session) {
    console.error(chalk.red(`No session found`));
    process.exit(1);
  }

  const stateFile = path.join(session.path, 'current-state.json');

  if (!fs.existsSync(stateFile)) {
    console.error(chalk.yellow(`No current state found. Is the observer running?`));
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));

  // Filter data based on options
  let consoleLogs = state.console || [];
  let networkRequests = state.network || [];

  // Apply time filter (--ago)
  if (options.ago !== null) {
    const cutoffTime = Date.now() - options.ago * 1000;
    consoleLogs = consoleLogs.filter(log => new Date(log.timestamp).getTime() >= cutoffTime);
    networkRequests = networkRequests.filter(req => new Date(req.timestamp).getTime() >= cutoffTime);
  }

  // Apply domain filter (--domain)
  if (options.domain) {
    networkRequests = networkRequests.filter(req => req.url.includes(options.domain));
  }

  // Apply errors-only filter
  let errors = [];
  if (options.errorsOnly) {
    errors = consoleLogs.filter(log => log.level === 'error' || log.level === 'warn');
  }

  // Generate output
  if (options.json) {
    outputJSON({ consoleLogs, networkRequests, errors, options, sessionId: state.sessionId });
  } else if (options.live) {
    // Note: --live would stream new events; for now show current state
    outputCompact({ consoleLogs, networkRequests, errors, options, state });
  } else {
    outputCompact({ consoleLogs, networkRequests, errors, options, state });
  }

  // Always exit cleanly to return control to CLI
  process.exit(0);
}

function parseArgs(args) {
  const options = {
    ago: null,
    domain: null,
    errorsOnly: false,
    json: false,
    live: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--ago=')) {
      options.ago = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--domain=')) {
      options.domain = arg.split('=')[1];
    } else if (arg === '--errors-only') {
      options.errorsOnly = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--live') {
      options.live = true;
    }
  }

  return options;
}

function outputCompact({ consoleLogs, networkRequests, errors, options, state }) {
  // Summary line
  const timeRange = options.ago ? `last ${options.ago}s` : 'entire session';
  const domainFilter = options.domain ? ` | Domain: ${options.domain}` : '';
  const errorCount = errors.length;
  const logCount = consoleLogs.filter(l => l.level === 'log').length;
  const warnCount = consoleLogs.filter(l => l.level === 'warn').length;
  const failedRequests = networkRequests.filter(r => r.status >= 400).length;
  const successRequests = networkRequests.filter(r => r.status < 400).length;

  console.log(chalk.cyan.bold('\n[SUMMARY]'));
  console.log(
    `Logs: ${logCount} | Warns: ${warnCount} | Errors: ${errorCount} | Network: ${networkRequests.length} (${successRequests} OK, ${failedRequests} failed) | Time: ${timeRange}${domainFilter}\n`
  );

  // Errors section (if any)
  if (errors.length > 0) {
    console.log(chalk.red.bold('[ERRORS]'));
    errors.slice(0, 5).forEach(err => {
      const timestamp = formatTimestamp(err.timestamp);
      console.log(`${chalk.red('❌')} ${timestamp} - ${err.text.substring(0, 80)}`);
    });
    console.log();
  }

  // Timeline section
  console.log(chalk.yellow.bold('[TIMELINE]'));

  // Merge and sort all events
  const allEvents = [];

  consoleLogs.forEach(log => {
    allEvents.push({
      type: 'console',
      timestamp: log.timestamp,
      level: log.level,
      text: log.text,
    });
  });

  networkRequests.forEach(req => {
    allEvents.push({
      type: 'network',
      timestamp: req.timestamp,
      method: req.method,
      url: req.url,
      status: req.status,
      duration: req.duration,
    });
  });

  allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Display timeline (limit to 20 entries)
  allEvents.slice(-20).forEach(event => {
    const timestamp = formatTimestamp(event.timestamp);

    if (event.type === 'console') {
      const icon = event.level === 'error' ? '❌' : event.level === 'warn' ? '⚠️ ' : '✓ ';
      const color = event.level === 'error' ? chalk.red : event.level === 'warn' ? chalk.yellow : chalk.white;
      console.log(`${timestamp}  ${icon} ${color(event.text.substring(0, 100))}`);
    } else if (event.type === 'network') {
      const statusColor = event.status >= 400 ? chalk.red : chalk.green;
      const icon = event.status >= 400 ? '❌' : '✓ ';
      const duration = event.duration ? ` (${event.duration.toFixed(0)}ms)` : '';
      const url = event.url.replace(/^https?:\/\//, '').substring(0, 60);
      console.log(`${timestamp}  ${icon} ${statusColor(event.method)} ${url} ${statusColor(event.status)}${duration}`);
    }
  });

  console.log();
}

function outputJSON({ consoleLogs, networkRequests, errors, options, sessionId }) {
  const output = {
    sessionId,
    timeRange: options.ago ? `last ${options.ago}s` : 'entire session',
    domain: options.domain || 'all',
    summary: {
      logs: consoleLogs.filter(l => l.level === 'log').length,
      warnings: consoleLogs.filter(l => l.level === 'warn').length,
      errors: errors.length,
      networkRequests: networkRequests.length,
      failedRequests: networkRequests.filter(r => r.status >= 400).length,
    },
    consoleLogs: consoleLogs.slice(-10),
    networkRequests: networkRequests.slice(-10),
    errors: errors.slice(-5),
  };

  console.log(JSON.stringify(output, null, 2));
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}
