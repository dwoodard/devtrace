import net from 'net';
import { execSync } from 'child_process';

export async function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

export async function findFreePort(startPort = 3333) {
  let port = startPort;
  while (port < startPort + 100) {
    if (await checkPort(port)) {
      return port;
    }
    port++;
  }
  return null;
}

export async function killProcessOnPort(port) {
  try {
    // Get all processes using this port, handling multiple PIDs
    const pidCommand = `lsof -ti :${port}`;
    const output = execSync(pidCommand, { encoding: 'utf-8' }).trim();

    if (output) {
      const pids = output.split('\n').filter(p => p);
      if (pids.length > 0) {
        // Kill all processes, using separate commands for robustness
        for (const pid of pids) {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        }
        // Wait a bit for cleanup
        await new Promise((resolve) => setTimeout(resolve, 500));
        return true;
      }
    }
    return false;
  } catch (err) {
    // Port is likely already free or lsof not available
    return false;
  }
}
