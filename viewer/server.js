// Live viewer for the SysML model.
//
// Serves the frontend from public/, the parsed model at /api/model and
// pushes a fresh model to the browser (server-sent events, /api/events)
// every time a .sysml file under model/ changes. When the OpenSysML `sysml`
// tool is available, its validation report and the load roll-up are sent too.
//
// Usage: node viewer/server.js [--port 5175] [--host 127.0.0.1] [--model ./model]

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listSysmlFiles, loadModel } from './lib/model-builder.js';
import { runTool } from './lib/sysml-tool.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const port = Number(option('port', process.env.PORT ?? 5175));
const host = option('host', process.env.HOST ?? '127.0.0.1');
const modelDir = path.resolve(option('model', path.join(here, '..', 'model')));
const publicDir = path.join(here, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

// Last successfully built model, the error of the latest attempt (if any)
// and what the sysml tool reported for it.
let state = { model: null, error: null, tool: null };
const clients = new Set();

async function rebuild() {
  try {
    const model = await loadModel(modelDir);
    const tool = await runTool(modelDir, model);
    state = { model, error: null, tool };
    console.log(`[model] ${Object.keys(model.instances).length} instances` +
      (model.warnings.length ? `, ${model.warnings.length} warnings` : '') +
      (tool.available ? `; ${tool.version}: ${tool.validation?.status}` : '; sysml tool not found'));
    for (const w of model.warnings) console.warn(`  warning: ${w}`);
    if (tool.rollupError) console.warn(`  ${tool.rollupError}`);
  } catch (err) {
    state = { ...state, error: err.message };
    console.error(`[model] ${err.message}`);
  }
  const payload = `event: model\ndata: ${JSON.stringify(state)}\n\n`;
  for (const res of clients) res.write(payload);
}

// Polling (rather than fs.watch) also sees edits made through a Docker bind mount.
let signature = '';
let building = false;
async function poll() {
  try {
    const files = await listSysmlFiles(modelDir);
    const stats = await Promise.all(files.map(async (f) => `${f}:${(await stat(f)).mtimeMs}`));
    const next = stats.join('|');
    if (next !== signature && !building) {
      signature = next;
      building = true;
      await rebuild();
      building = false;
    }
  } catch (err) {
    console.error(`[watch] ${err.message}`);
  }
  setTimeout(poll, 500);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/model') {
    res.writeHead(200, { 'content-type': MIME['.json'], 'cache-control': 'no-store' });
    res.end(JSON.stringify(state));
    return;
  }
  if (url.pathname === '/api/events') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    });
    res.write(`event: model\ndata: ${JSON.stringify(state)}\n\n`);
    clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => {
      clearInterval(ping);
      clients.delete(res);
    });
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

await poll();
server.listen(port, host, () => {
  console.log(`Viewer: http://localhost:${port}  (watching ${modelDir})`);
});
