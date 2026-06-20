import fs from 'fs';
import path from 'path';
import readline from 'readline';

export class ChangeAnalyzer {
  constructor(sessionPath) {
    this.sessionPath = sessionPath;
  }

  async analyzeChanges() {
    const changes = {
      errors: [],
      failures: [],
      navigations: [],
      activities: [],
    };

    // Read console events
    await this.analyzeConsole(changes);

    // Read network events
    await this.analyzeNetwork(changes);

    return this.rankChanges(changes);
  }

  async analyzeConsole(changes) {
    const consoleFile = path.join(this.sessionPath, 'console.jsonl');

    if (!fs.existsSync(consoleFile)) {
      return;
    }

    const fileStream = fs.createReadStream(consoleFile);
    const rl = readline.createInterface({ input: fileStream });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line);

        if (event.level === 'error') {
          changes.errors.push({
            type: 'console-error',
            text: event.text,
            timestamp: event.timestamp,
            severity: 'high',
          });
        }
      } catch (err) {
        // Skip invalid JSON
      }
    }
  }

  async analyzeNetwork(changes) {
    const networkFile = path.join(this.sessionPath, 'network.jsonl');

    if (!fs.existsSync(networkFile)) {
      return;
    }

    const fileStream = fs.createReadStream(networkFile);
    const rl = readline.createInterface({ input: fileStream });

    let previousUrl = null;

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line);

        // Detect failures (4xx, 5xx, or network errors)
        if (event.status >= 400 || event.status === 0) {
          const statusText = event.status === 0 ? 'Network Error' : `${event.status}`;
          changes.failures.push({
            type: 'failed-request',
            method: event.method,
            url: event.url,
            status: statusText,
            timestamp: event.timestamp,
            severity: 'high',
          });
        }

        // Detect navigations (page loads)
        if (event.method === 'GET' && event.status === 200) {
          const domain = this.extractDomain(event.url);
          if (domain && domain !== previousUrl) {
            previousUrl = domain;
            changes.navigations.push({
              type: 'navigation',
              url: domain,
              timestamp: event.timestamp,
              severity: 'medium',
            });
          }
        }
      } catch (err) {
        // Skip invalid JSON
      }
    }
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname.split('/')[1]; // Get host + first path segment
    } catch {
      return null;
    }
  }

  rankChanges(changes) {
    // Combine and sort by severity and timestamp
    const allChanges = [
      ...changes.errors.map(c => ({ ...c, order: 1 })),
      ...changes.failures.map(c => ({ ...c, order: 2 })),
      ...changes.navigations.map(c => ({ ...c, order: 3 })),
    ];

    // Sort by order (severity) then by timestamp
    allChanges.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    // Return top 4 changes
    return allChanges.slice(0, 4);
  }
}
