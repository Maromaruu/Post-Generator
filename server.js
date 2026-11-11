// aisocnews post generator — local server (Node 18+, no dependencies).
// Serves the app and proxies aisocnews.com pages, because the site sends no CORS
// headers and a browser cannot read it directly.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8770;
const ROOT = __dirname;
const ALLOWED_HOSTS = new Set(['aisocnews.com', 'www.aisocnews.com']);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

async function proxy(req, res, target) {
  let url;
  try { url = new URL(target); } catch { return send(res, 400, 'Not a valid URL.'); }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return send(res, 400, 'Only http(s) links are supported.');
  url.protocol = 'https:';
  if (!ALLOWED_HOSTS.has(url.hostname)) return send(res, 400, 'Only aisocnews.com links are supported.');
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (post-generator)', Accept: 'text/html' },
      redirect: 'follow', signal: AbortSignal.timeout(30000)
    });
    if (!ALLOWED_HOSTS.has(new URL(r.url).hostname)) return send(res, 502, 'The link redirected away from aisocnews.com.');
    if (!r.ok) return send(res, 502, `aisocnews.com answered ${r.status}.`);
    send(res, 200, await r.text(), 'text/html; charset=utf-8');
  } catch (e) {
    send(res, 502, 'Could not reach aisocnews.com: ' + (e && e.message ? e.message : e));
  }
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/api/fetch') return proxy(req, res, u.searchParams.get('url') || '');
  let rel = decodeURIComponent(u.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) || path.basename(file).startsWith('.')) return send(res, 403, 'Forbidden');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    send(res, 200, data, TYPES[path.extname(file)] || 'application/octet-stream');
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Post generator running at http://localhost:${PORT}`);
});
