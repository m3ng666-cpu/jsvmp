const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const health = await request({ hostname: '127.0.0.1', port: 8080, path: '/health', method: 'GET' });
  const api = await request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/js/jsString',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
  }, 'jsString=' + encodeURIComponent('console.log("free jsvmp encrypt")'));

  const ok = health.status === 200 && api.status === 200 && api.body.includes('"state": "成功"');
  console.log(JSON.stringify({
    ok,
    healthStatus: health.status,
    apiStatus: api.status,
    apiPreview: api.body.slice(0, 200),
  }, null, 2));

  process.exit(ok ? 0 : 1);
})().catch(error => {
  console.error(error.stack || String(error));
  process.exit(1);
});
