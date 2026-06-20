// Captures user actions: navigation, form submissions, clicks, input
export function setupActionCapture(cdpClient, onAction) {
  // Track page navigation
  cdpClient.on('Page.frameNavigated', (params) => {
    const { frame } = params;
    if (frame.parentId === undefined) {
      // Only track main frame navigation
      onAction({
        type: 'navigation',
        url: frame.url,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Listen for console messages that indicate form submissions
  // (can be enhanced with actual form detection via Runtime.evaluate)
  cdpClient.on('Runtime.consoleAPICalled', (params) => {
    const { args, type } = params;

    // Capture if console is logging a form submission or action
    if (type === 'log' || type === 'info') {
      try {
        const message = args
          .map((arg) => {
            if (arg.value) return arg.value;
            if (arg.description) return arg.description;
            return '';
          })
          .join(' ');

        // Look for form submission indicators
        if (message.includes('submit') || message.includes('form')) {
          onAction({
            type: 'form-submission',
            message: message.substring(0, 200),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        // Skip on error
      }
    }
  });
}
