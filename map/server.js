import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const port = Number(option('port', process.env.PORT ?? 5176));
const host = option('host', process.env.HOST ?? '127.0.0.1');
const layoutFile = path.resolve(option('layout', path.join(here, 'layout.json')));
const publicDir = path.join(here, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/layout') {
    if (req.method === 'GET') {
      try {
        const body = await readFile(layoutFile);
        res.writeHead(200, { 'content-type': MIME['.json'], 'cache-control': 'no-store' });
        res.end(body);
      } catch (err) {
        res.writeHead(500, { 'content-type': MIME['.json'], 'cache-control': 'no-store' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    } else if (req.method === 'POST') {
      try {
        let body = '';
        for await (const chunk of req) body += chunk;
        await writeFile(layoutFile, body, 'utf8');
        res.writeHead(200, { 'content-type': MIME['.json'], 'cache-control': 'no-store' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'content-type': MIME['.json'], 'cache-control': 'no-store' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
    res.writeHead(405).end();
    return;
  }
  const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  const file = path.join(publicDir, rel);
  if (!file.startsWith(publicDir)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`Map: http://localhost:${port}  (layout: ${layoutFile})`);
});
