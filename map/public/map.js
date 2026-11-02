const svg = document.getElementById('map');
const coordsEl = document.getElementById('coords');
const gridStepEl = document.getElementById('grid-step');
const zoomEl = document.getElementById('zoom');
const fitBtn = document.getElementById('fit');

const nf = new Intl.NumberFormat('lt-LT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let layout = { step: 0.1, rooms: [], devices: [] };
const view = { s: 60, ox: 60, oy: 60 };
let cursor = null;
let drag = null;

const STEP_CANDIDATES = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
const MIN_PX = 7;
const MAJOR_PX = 48;

const snap = (v) => Math.round(v / layout.step) * layout.step;
const clean = (v) => +v.toFixed(10);
const toScreenX = (wx) => wx * view.s + view.ox;
const toScreenY = (wy) => wy * view.s + view.oy;
const toWorldX = (px) => (px - view.ox) / view.s;
const toWorldY = (py) => (py - view.oy) / view.s;

function devicePos(d) {
  const room = layout.rooms.find((r) => r.id === d.room);
  return { x: (room?.planX ?? 0) + d.planX, y: (room?.planY ?? 0) + d.planY };
}

function pickStep(minPx) {
  return STEP_CANDIDATES.find((s) => s * view.s >= minPx) ?? STEP_CANDIDATES.at(-1);
}

function gridLines(min, max, step) {
  const lines = [];
  const i0 = Math.ceil(min / step - 1e-9);
  const i1 = Math.floor(max / step + 1e-9);
  for (let i = i0; i <= i1; i++) lines.push(clean(i * step));
  return lines;
}

function render() {
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  if (!w || !h) return;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const minX = toWorldX(0);
  const minY = toWorldY(0);
  const maxX = toWorldX(w);
  const maxY = toWorldY(h);

  const minor = pickStep(MIN_PX);
  const major = pickStep(MAJOR_PX);
  const isMajor = (x) => Math.abs(x / major - Math.round(x / major)) < 1e-6;

  const out = [];

  for (const x of gridLines(minX, maxX, minor)) {
    if (isMajor(x)) continue;
    out.push(`<line class="grid-minor" x1="${toScreenX(x)}" y1="0" x2="${toScreenX(x)}" y2="${h}"/>`);
  }
  for (const y of gridLines(minY, maxY, minor)) {
    if (isMajor(y)) continue;
    out.push(`<line class="grid-minor" x1="0" y1="${toScreenY(y)}" x2="${w}" y2="${toScreenY(y)}"/>`);
  }
  for (const x of gridLines(minX, maxX, major)) {
    out.push(`<line class="grid-major" x1="${toScreenX(x)}" y1="0" x2="${toScreenX(x)}" y2="${h}"/>`);
    out.push(`<text class="grid-label" x="${toScreenX(x) + 3}" y="13">${nf.format(x)}</text>`);
  }
  for (const y of gridLines(minY, maxY, major)) {
    out.push(`<line class="grid-major" x1="0" y1="${toScreenY(y)}" x2="${w}" y2="${toScreenY(y)}"/>`);
    out.push(`<text class="grid-label" x="4" y="${toScreenY(y) - 4}">${nf.format(y)}</text>`);
  }

  if (minX <= 0 && maxX >= 0) {
    out.push(`<line class="axis" x1="${toScreenX(0)}" y1="0" x2="${toScreenX(0)}" y2="${h}"/>`);
    out.push(`<text class="axis-label" x="${w - 24}" y="${toScreenY(0) - 6}">x →</text>`);
  }
  if (minY <= 0 && maxY >= 0) {
    out.push(`<line class="axis" x1="0" y1="${toScreenY(0)}" x2="${w}" y2="${toScreenY(0)}"/>`);
    out.push(`<text class="axis-label" x="${toScreenX(0) + 6}" y="${h - 8}">↓ y</text>`);
  }

  for (const r of layout.rooms) {
    const x = toScreenX(r.planX);
    const y = toScreenY(r.planY);
    const rw = r.planWidth * view.s;
    const rh = r.planDepth * view.s;
    const wall = Math.min(Math.max(0.1 * view.s, 2), 10);
    out.push(`<g class="room" data-id="${escapeHtml(r.id)}">
      <rect x="${x}" y="${y}" width="${rw}" height="${rh}" stroke-width="${wall}"/>
      <text class="room-origin" x="${x + wall + 6}" y="${y + wall + 16}">(${nf.format(r.planX)}, ${nf.format(r.planY)})</text>
      <text class="room-name" x="${x + rw / 2}" y="${y + rh / 2 - 4}">${escapeHtml(r.name)}</text>
      <text class="room-size" x="${x + rw / 2}" y="${y + rh / 2 + 16}">${nf.format(r.planWidth)} × ${nf.format(r.planDepth)} m</text>
    </g>`);
  }

  for (const d of layout.devices) {
    const p = devicePos(d);
    const x = toScreenX(p.x);
    const y = toScreenY(p.y);
    out.push(`<g class="device" data-id="${escapeHtml(d.id)}">
      <circle cx="${x}" cy="${y}" r="${Math.min(Math.max(0.06 * view.s, 3), 9)}"/>
      <text x="${x + 12}" y="${y + 4}">${escapeHtml(d.name ?? d.id)}</text>
    </g>`);
  }

  if (cursor) {
    const sx = snap(cursor.x);
    const sy = snap(cursor.y);
    out.push(`<line class="cross" x1="${toScreenX(sx)}" y1="0" x2="${toScreenX(sx)}" y2="${h}"/>`);
    out.push(`<line class="cross" x1="0" y1="${toScreenY(sy)}" x2="${w}" y2="${toScreenY(sy)}"/>`);
    out.push(`<circle class="cross-dot" cx="${toScreenX(sx)}" cy="${toScreenY(sy)}" r="3"/>`);
    coordsEl.textContent = `x ${nf.format(sx)} m · y ${nf.format(sy)} m`;
  } else {
    coordsEl.textContent = 'x – m · y – m';
  }

  gridStepEl.textContent = `tinklelis ${nf.format(minor)} m`;
  zoomEl.textContent = `1 m = ${Math.round(view.s)} px`;

  svg.innerHTML = out.join('\n');
}

function fit() {
  const pts = [[0, 0]];
  for (const r of layout.rooms) {
    pts.push([r.planX, r.planY], [r.planX + r.planWidth, r.planY + r.planDepth]);
  }
  for (const d of layout.devices) pts.push([devicePos(d).x, devicePos(d).y]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs) - 1;
  const minY = Math.min(...ys) - 1;
  const maxX = Math.max(...xs) + 1;
  const maxY = Math.max(...ys) + 1;
  const w = svg.clientWidth;
  const h = svg.clientHeight;
  if (!w || !h) return;
  view.s = Math.min(Math.max(Math.min(w / (maxX - minX), h / (maxY - minY)), 4), 600);
  view.ox = (w - (maxX - minX) * view.s) / 2 - minX * view.s;
  view.oy = (h - (maxY - minY) * view.s) / 2 - minY * view.s;
  render();
}

function pointerPos(e) {
  const rect = svg.getBoundingClientRect();
  return { px: e.clientX - rect.left, py: e.clientY - rect.top };
}

svg.addEventListener('pointerdown', (e) => {
  drag = { cx: e.clientX, cy: e.clientY, ox: view.ox, oy: view.oy };
  svg.setPointerCapture(e.pointerId);
});
svg.addEventListener('pointermove', (e) => {
  const { px, py } = pointerPos(e);
  cursor = { x: toWorldX(px), y: toWorldY(py) };
  if (drag) {
    view.ox = drag.ox + (e.clientX - drag.cx);
    view.oy = drag.oy + (e.clientY - drag.cy);
  }
  render();
});
svg.addEventListener('pointerup', () => { drag = null; });
svg.addEventListener('pointercancel', () => { drag = null; });
svg.addEventListener('pointerleave', () => { cursor = null; render(); });
svg.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { px, py } = pointerPos(e);
  const wx = toWorldX(px);
  const wy = toWorldY(py);
  view.s = Math.min(Math.max(view.s * Math.exp(-e.deltaY * 0.0012), 4), 600);
  view.ox = px - wx * view.s;
  view.oy = py - wy * view.s;
  render();
}, { passive: false });

fitBtn.addEventListener('click', fit);
window.addEventListener('keydown', (e) => { if (e.key === 'f') fit(); });
window.addEventListener('resize', render);

try {
  const res = await fetch('/api/layout');
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  layout = await res.json();
  fit();
} catch (err) {
  coordsEl.textContent = `klaida: ${err.message}`;
}
