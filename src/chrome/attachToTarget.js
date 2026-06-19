import WebSocket from 'ws';

export class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.messageId = 0;
    this.pendingMessages = new Map();
    this.listeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
        this.setupMessageListener();
        resolve();
      });

      this.ws.on('error', reject);
      this.ws.on('close', () => {
        this.listeners.clear();
        this.pendingMessages.clear();
      });
    });
  }

  setupMessageListener() {
    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);

        if (msg.id) {
          const pending = this.pendingMessages.get(msg.id);
          if (pending) {
            this.pendingMessages.delete(msg.id);
            if (msg.error) {
              pending.reject(new Error(msg.error.message));
            } else {
              pending.resolve(msg.result);
            }
          }
        } else if (msg.method) {
          const listeners = this.listeners.get(msg.method) || [];
          listeners.forEach((fn) => fn(msg.params));
        }
      } catch (err) {
        console.error('Failed to parse CDP message:', err);
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const msg = { id, method, params };

      this.pendingMessages.set(id, { resolve, reject });

      try {
        this.ws.send(JSON.stringify(msg));
      } catch (err) {
        this.pendingMessages.delete(id);
        reject(err);
      }
    });
  }

  on(method, callback) {
    if (!this.listeners.has(method)) {
      this.listeners.set(method, []);
    }
    this.listeners.get(method).push(callback);
  }

  async close() {
    return new Promise((resolve) => {
      if (this.ws) {
        this.ws.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
