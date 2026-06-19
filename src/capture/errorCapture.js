export function setupErrorCapture(cdpClient, onError) {
  cdpClient.on('Runtime.exceptionThrown', (params) => {
    const { exceptionDetails } = params;
    const { text, url, lineNumber, columnNumber } = exceptionDetails;

    onError({
      text,
      url,
      line: lineNumber,
      column: columnNumber,
      timestamp: new Date(exceptionDetails.timestamp).toISOString(),
    });
  });
}
