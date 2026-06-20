import fs from 'fs';
import path from 'path';
import os from 'os';

const sessionsDir = path.join(os.homedir(), '.devtrace', 'sessions');

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

  cleanupOldSessions(maxSessions = 50) {
    const sessions = this.listSessions();
    if (sessions.length > maxSessions) {
      const toDelete = sessions.slice(maxSessions);
      for (const sessionId of toDelete) {
        const sessionPath = path.join(sessionsDir, sessionId);
        try {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        } catch (err) {
          console.warn(`Failed to delete session ${sessionId}:`, err.message);
        }
      }
    }
  }
}

export const sessionManager = new SessionManager();
