import http from 'http';

export async function discoverTargets(port) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}/json/list`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const targets = JSON.parse(data);
          resolve(targets);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);

    req.setTimeout(2000, () => {
      req.destroy();
      reject(new Error('Chrome DevTools port timeout'));
    });
  });
}
