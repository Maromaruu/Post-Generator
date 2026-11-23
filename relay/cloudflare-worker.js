// Relay for the aisocnews post generator, for when the tool is hosted as a static site
// (GitHub Pages and the like) and server.js is not running.
// It does what server.js does: fetches one aisocnews.com page and hands it back with a header
// that lets the tool's page read it. It refuses every other address.
//
// Deploy (Cloudflare Workers, free plan): create a Worker, paste this file, deploy, then put the
// Worker's address followed by "?url=" in index.html:
//   <script>window.POST_RELAY = 'https://your-worker.your-name.workers.dev/?url=';</script>
// Set ALLOW_ORIGIN below to the address the tool is served from.

const ALLOW_ORIGIN = 'https://maromaruu.github.io';
const ALLOWED_HOSTS = ['aisocnews.com', 'www.aisocnews.com'];

export default {
  async fetch(request) {
    const cors = { 'Access-Control-Allow-Origin': ALLOW_ORIGIN, Vary: 'Origin' };
    const reply = (status, body) => new Response(body, { status, headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } });
    if (request.method !== 'GET') return reply(405, 'Only GET is supported.');
    let target;
    try { target = new URL(new URL(request.url).searchParams.get('url') || ''); } catch { return reply(400, 'Not a valid URL.'); }
    if (!ALLOWED_HOSTS.includes(target.hostname)) return reply(400, 'Only aisocnews.com links are supported.');
    target.protocol = 'https:';
    try {
      const r = await fetch(target.toString(), { headers: { 'User-Agent': 'Mozilla/5.0 (post-generator)', Accept: 'text/html' } });
      if (!ALLOWED_HOSTS.includes(new URL(r.url).hostname)) return reply(502, 'The link redirected away from aisocnews.com.');
      if (!r.ok) return reply(502, `aisocnews.com answered ${r.status}.`);
      return new Response(await r.text(), { headers: { ...cors, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    } catch (e) {
      return reply(502, 'Could not reach aisocnews.com.');
    }
  }
};
