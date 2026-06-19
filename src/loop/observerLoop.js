import { discoverTargets } from '../chrome/discoverTargets.js';
import { CDPClient } from '../chrome/attachToTarget.js';
import { setupConsoleCapture } from '../capture/consoleCapture.js';
import { setupNetworkCapture } from '../capture/networkCapture.js';
import { setupErrorCapture } from '../capture/errorCapture.js';
import { setupPageCapture, capturePageSnapshot } from '../capture/pageSnapshot.js';
import { JsonlWriter } from '../storage/jsonlWriter.js';
import { CurrentStateWriter } from '../storage/currentStateWriter.js';
import chalk from 'chalk';

export async function observerLoop(chrome, session, port) {
  const consoleWriter = new JsonlWriter(`${session.path}/console.jsonl`);
  const networkWriter = new JsonlWriter(`${session.path}/network.jsonl`);
  const errorWriter = new JsonlWriter(`${session.path}/errors.jsonl`);
  const eventWriter = new JsonlWriter(`${session.path}/events.jsonl`);
  const stateWriter = new CurrentStateWriter(session.path, session.id);

  const attachedTargets = new Map();

  const teardown = async () => {
    for (const client of attachedTargets.values()) {
      try {
        await client.close();
      } catch (err) {
        // Ignore close errors
      }
    }
    attachedTargets.clear();

    await consoleWriter.close();
    await networkWriter.close();
    await errorWriter.close();
    await eventWriter.close();
  };

  process.on('SIGINT', async () => {
    await teardown();
    process.exit(0);
  });

  const attachToTarget = async (targetId, targetUrl) => {
    if (attachedTargets.has(targetId)) {
      return;
    }

    try {
      const targets = await discoverTargets(port);
      const target = targets.find((t) => t.id === targetId);

      if (!target || !target.webSocketDebuggerUrl) {
        return;
      }

      const client = new CDPClient(target.webSocketDebuggerUrl);
      await client.connect();

      // Enable CDP domains
      await client.send('Page.enable');
      await client.send('Runtime.enable');
      await client.send('Network.enable');
      await client.send('Console.enable');

      attachedTargets.set(targetId, client);

      // Setup capture handlers
      setupConsoleCapture(client, (msg) => {
        consoleWriter.append(msg);
        stateWriter.addConsoleMessage(msg);
        eventWriter.append({ type: 'console', ...msg });
      });

      setupNetworkCapture(
        client,
        (req) => {
          // Request started
        },
        (resp) => {
          networkWriter.append(resp);
          stateWriter.addNetworkMessage(resp);
          eventWriter.append({ type: 'network', ...resp });
        }
      );

      setupErrorCapture(client, (err) => {
        errorWriter.append(err);
        stateWriter.addError(err);
        eventWriter.append({ type: 'error', ...err });
      });

      setupPageCapture(client, async (change) => {
        if (change.type === 'navigation') {
          stateWriter.setPageNavigation(targetUrl || change.url, change.title);
          eventWriter.append({ type: 'navigation', ...change });
        } else if (change.type === 'snapshot') {
          stateWriter.setPageSnapshot(change.snapshot);
        }
      });

      // Get initial page title
      try {
        const result = await client.send('Runtime.evaluate', {
          expression: 'document.title',
          returnByValue: true,
        });
        stateWriter.setPageNavigation(targetUrl, result.value || '');
      } catch (err) {
        // Ignore evaluation errors
      }

      // Take initial snapshot
      try {
        const snapshot = await capturePageSnapshot(client);
        stateWriter.setPageSnapshot(snapshot);
      } catch (err) {
        // Ignore snapshot errors
      }
    } catch (err) {
      console.error(`Failed to attach to target ${targetId}:`, err.message);
      errorWriter.append({
        text: `Failed to attach to target: ${err.message}`,
        url: targetUrl,
        timestamp: new Date().toISOString(),
      });
    }
  };

  let chromeNotFoundWarningShown = false;
  let successfulDiscoveries = 0;

  const discoveryLoop = async () => {
    try {
      const targets = await discoverTargets(port);

      // Reset the warning flag if we successfully connect
      if (targets && targets.length >= 0) {
        successfulDiscoveries++;
        if (successfulDiscoveries === 1) {
          chromeNotFoundWarningShown = false; // Reset on first success
        }

        for (const target of targets) {
          // Only attach to page targets, not workers or other types
          if (target.type === 'page' && target.webSocketDebuggerUrl) {
            await attachToTarget(target.id, target.url);
          }
        }
      }
    } catch (err) {
      // Show helpful message on first error or periodically
      if (!chromeNotFoundWarningShown || successfulDiscoveries === 0) {
        chromeNotFoundWarningShown = true;
        console.error(chalk.yellow('\n⚠️  Chrome is not responding on port ' + port));
        console.error(chalk.yellow('Make sure Chrome is running with debugging enabled:\n'));
        console.error(chalk.gray('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\'));
        console.error(chalk.gray('  --remote-debugging-port=' + port + '\n'));
        console.error(chalk.yellow('Waiting for Chrome to connect...\n'));
      }
    }

    setTimeout(discoveryLoop, 2000);
  };

  discoveryLoop();

  // Keep the process alive
  await new Promise(() => {
    // This will never resolve - we rely on SIGINT or Chrome closing
  });
}
