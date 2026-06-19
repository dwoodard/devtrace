import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sessionsDir = path.join(__dirname, '../../sessions');

class SessionManager {
  createSession() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '-');
    const timeStr = now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    const sessionId = `${dateStr}-${timeStr}`;

    const sessionPath = path.join(sessionsDir, sessionId);
    const latestPath = path.join(sessionsDir, 'latest');

    fs.mkdirSync(sessionPath, { recursive: true });

    // Update latest symlink
    try {
      if (fs.existsSync(latestPath)) {
        fs.unlinkSync(latestPath);
      }
      fs.symlinkSync(sessionPath, latestPath);
    } catch (err) {
      // Symlink may not work on all systems, that's okay
      console.warn('Could not create symlink, using direct path');
    }

    return {
      id: sessionId,
      path: sessionPath,
    };
  }

  getSession(sessionId) {
    if (sessionId === 'latest') {
      const latestPath = path.join(sessionsDir, 'latest');
      if (fs.existsSync(latestPath)) {
        return {
          id: 'latest',
          path: fs.realpathSync(latestPath),
        };
      }
      return null;
    }

    const sessionPath = path.join(sessionsDir, sessionId);
    if (fs.existsSync(sessionPath)) {
      return {
        id: sessionId,
        path: sessionPath,
      };
    }

    return null;
  }

  listSessions() {
    if (!fs.existsSync(sessionsDir)) {
      return [];
    }

    return fs
      .readdirSync(sessionsDir)
      .filter((name) => name !== 'latest' && name !== '.gitkeep')
      .sort()
      .reverse();
  }
}

export const sessionManager = new SessionManager();
