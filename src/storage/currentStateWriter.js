import fs from 'fs';
import path from 'path';

export class CurrentStateWriter {
  constructor(sessionPath, sessionId) {
    this.filepath = path.join(sessionPath, 'current-state.json');
    this.sessionId = sessionId;
    this.state = {
      sessionId,
      activeUrl: '',
      title: '',
      lastNavigation: new Date().toISOString(),
      summary: {
        consoleErrors: 0,
        consoleWarnings: 0,
        failedRequests: 0,
        lastError: null,
      },
      console: [],
      network: [],
      errors: [],
      pageSnapshot: {
        text: '',
        buttons: [],
        links: [],
        forms: [],
      },
    };

    this.writeState();
  }

  addConsoleMessage(msg) {
    this.state.console.push(msg);
    this.state.console = this.state.console.slice(-20); // Keep last 20

    if (msg.level === 'error') {
      this.state.summary.consoleErrors += 1;
      this.state.summary.lastError = msg.text;
    } else if (msg.level === 'warn') {
      this.state.summary.consoleWarnings += 1;
    }

    this.writeState();
  }

  addNetworkMessage(msg) {
    this.state.network.push(msg);
    this.state.network = this.state.network.slice(-20); // Keep last 20

    if (msg.status >= 400 || msg.error) {
      this.state.summary.failedRequests += 1;
    }

    this.writeState();
  }

  addError(err) {
    this.state.errors.push(err);
    this.state.errors = this.state.errors.slice(-10); // Keep last 10
    this.state.summary.lastError = err.text;

    this.writeState();
  }

  setPageNavigation(url, title) {
    this.state.activeUrl = url;
    this.state.title = title;
    this.state.lastNavigation = new Date().toISOString();

    this.writeState();
  }

  setPageSnapshot(snapshot) {
    this.state.pageSnapshot = snapshot;
    this.writeState();
  }

  writeState() {
    fs.writeFileSync(this.filepath, JSON.stringify(this.state, null, 2));
  }

  getState() {
    return this.state;
  }
}
