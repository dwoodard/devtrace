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
      // Find the most recent valid session
      const recentSession = this.getMostRecentSession();

      // Repair the symlink if needed
      this.repairLatestSymlink(recentSession);

      return recentSession;
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

  getMostRecentSession() {
    const sessions = this.listSessions();
    if (sessions.length === 0) {
      return null;
    }
    const mostRecent = sessions[0];
    const sessionPath = path.join(sessionsDir, mostRecent);
    return {
      id: 'latest',
      path: sessionPath,
    };
  }

  repairLatestSymlink(recentSession) {
    const latestPath = path.join(sessionsDir, 'latest');

    try {
      const stats = fs.lstatSync(latestPath);
      if (stats.isSymbolicLink()) {
        // Check if symlink target exists
        try {
          fs.realpathSync(latestPath);
          // Target exists, symlink is valid
          return;
        } catch (err) {
          // Symlink is broken, remove it
          fs.unlinkSync(latestPath);
        }
      }
    } catch (err) {
      // Symlink doesn't exist or we can't stat it, that's fine
    }

    // Recreate symlink to point to the most recent valid session
    if (recentSession) {
      try {
        // Make sure there's no leftover file/link
        try {
          fs.unlinkSync(latestPath);
        } catch (e) {
          // Ignore
        }
        fs.symlinkSync(recentSession.path, latestPath);
      } catch (err) {
        // Symlink may not work on all systems, that's okay
      }
    }
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
