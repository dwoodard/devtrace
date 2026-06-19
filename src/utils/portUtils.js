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

    server.listen(port, '127.0.0.1');
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
    // Get the process using this port
    const pidCommand = `lsof -ti :${port}`;
    const pid = execSync(pidCommand, { encoding: 'utf-8' }).trim();

    if (pid) {
      // Kill the process
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      // Wait a bit for cleanup
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    }
    return false;
  } catch (err) {
    // Port is likely already free or lsof not available
    return false;
  }
}
