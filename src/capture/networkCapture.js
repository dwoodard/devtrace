const requestMap = new Map();

export function setupNetworkCapture(cdpClient, onRequest, onResponse) {
  cdpClient.on('Network.requestWillBeSent', (params) => {
    const { requestId, request, timestamp } = params;
    const { url, method } = request;

    requestMap.set(requestId, {
      url,
      method,
      timestamp: new Date(timestamp * 1000).toISOString(),
    });
  });

  cdpClient.on('Network.responseReceived', (params) => {
    const { requestId, response, timestamp } = params;
    const { url, status } = response;
    const req = requestMap.get(requestId);

    if (req) {
      onResponse({
        url,
        method: req.method,
        status,
        timestamp: new Date(timestamp * 1000).toISOString(),
      });
      requestMap.delete(requestId);
    }
  });

  cdpClient.on('Network.loadingFailed', (params) => {
    const { requestId, errorText } = params;
    const req = requestMap.get(requestId);

    if (req) {
      onResponse({
        url: req.url,
        method: req.method,
        status: 0,
        error: errorText,
        timestamp: req.timestamp,
      });
      requestMap.delete(requestId);
    }
  });
}
