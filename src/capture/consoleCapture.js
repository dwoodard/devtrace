export function setupConsoleCapture(cdpClient, onMessage) {
  cdpClient.on('Runtime.consoleAPICalled', (params) => {
    const { type, args, timestamp } = params;
    const text = args.map((arg) => formatArgument(arg)).join(' ');

    onMessage({
      level: type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'log',
      text,
      timestamp: new Date(timestamp).toISOString(),
    });
  });

  cdpClient.on('Runtime.exceptionThrown', (params) => {
    const { exceptionDetails } = params;
    const text = exceptionDetails.text || 'Unknown error';

    onMessage({
      level: 'error',
      text,
      timestamp: new Date(exceptionDetails.timestamp).toISOString(),
    });
  });
}

function formatArgument(arg) {
  if (arg.type === 'string') {
    return arg.value || '';
  } else if (arg.type === 'number' || arg.type === 'boolean') {
    return String(arg.value);
  } else if (arg.type === 'undefined') {
    return 'undefined';
  } else if (arg.type === 'object') {
    if (arg.subtype === 'null') {
      return 'null';
    }
    if (arg.preview) {
      return arg.preview.description || '[Object]';
    }
    return '[Object]';
  } else {
    return arg.description || String(arg);
  }
}
