import fs from 'fs';
import path from 'path';

export class JsonlWriter {
  constructor(filepath) {
    this.filepath = filepath;
    this.queue = [];
    this.isWriting = false;
    this.flushInterval = setInterval(() => this.flush(), 1000);
  }

  append(obj) {
    this.queue.push(obj);

    if (this.queue.length >= 100) {
      this.flush();
    }
  }

  flush() {
    if (this.queue.length === 0 || this.isWriting) {
      return;
    }

    this.isWriting = true;
    const lines = this.queue.map((obj) => JSON.stringify(obj)).join('\n') + '\n';

    fs.appendFile(this.filepath, lines, (err) => {
      this.isWriting = false;
      if (err) {
        console.error(`Failed to write to ${this.filepath}:`, err);
      } else {
        this.queue = [];
      }
    });
  }

  async close() {
    this.flush();
    clearInterval(this.flushInterval);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }
}
