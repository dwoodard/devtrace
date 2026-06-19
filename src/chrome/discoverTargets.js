import http from 'http';

export async function discoverTargets(port) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}/json/list`, (res) => {
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
  });
}
