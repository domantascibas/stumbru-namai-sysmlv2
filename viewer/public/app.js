// Viewer entry point: receives the model from the server (live, over
// server-sent events), runs the simulator on it with the state chosen here
// (breakers, switches, appliances) and renders the plan, the panel and the
// details of the selected element.

import { simulate, emptyState, gangCount, is, roomOf, PHASES } from './simulate.js';
import { layoutPlan, renderPlan } from './plan.js';
import { renderPanel, renderPhases } from './panel.js';
import { fmtPower, fmtCurrent, fmtValue, escapeHtml, displayName, shortName } from './format.js';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'apartment-sim-state-v1';
const FLASH_MS = 2600;

const app = {
  model: null, error: null, tool: null, sim: null, layout: null,
  state: loadState(), selected: null, viewBox: null, connected: false,
  flash: {}, flashTimer: null,
};

// ------------------------------------------------------------------ simulator state

function loadState() {
  // ?state=<JSON> starts from a given scenario (shareable link, screenshots).
  const fromUrl = new URLSearchParams(location.search).get('state');
  if (fromUrl) {
    try {
      return { ...emptyState(), ...JSON.parse(fromUrl) };
    } catch {
      /* ignore a malformed scenario */
    }
  }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.breakers && saved?.switches && saved?.devices) return saved;
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return emptyState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(app.state));
  } catch {
    /* not persisted, still works for this session */
  }
}

// Apply a change to the simulator state, then highlight what it did:
// devices that got power, devices that lost it, and appliances that started or stopped.
function change(mutate, describe) {
  const before = app.sim;
  mutate(app.state);
  saveState();
  app.sim = simulate(app.model, app.state, app.tool?.rollup ?? null);
  const gained = [];
  const lost = [];
  const flash = {};
  for (const [id, d] of Object.entries(app.sim.devices)) {
    const prev = before.devices[id];
    if (!prev) continue;
    if (d.live && !prev.live) gained.push(id);
    if (!d.live && prev.live) lost.push(id);
    if (d.live !== prev.live || d.active !== prev.active) flash[id] = d.live && (d.active || !prev.live) ? 'gain' : 'loss';
  }
  for (const [id, b] of Object.entries(app.sim.breakers)) {
    const prev = before.breakers[id];
    if (prev && (b.closed !== prev.closed || b.energized !== prev.energized)) flash[id] = b.closed && b.energized ? 'gain' : 'loss';
  }
  app.flash = flash;
  clearTimeout(app.flashTimer);
  app.flashTimer = setTimeout(() => {
    app.flash = {};
    render();
  }, FLASH_MS);
  toast(describe, gained, lost);
  render();
}

// Short name for messages: the plan label of wall devices, else the first words of the doc.
const shortLabel = (inst) => (is(inst, 'Load') && !is(inst, 'Light') ? shortName(inst) : inst.attrs.label ?? shortName(inst));

function toggle(id, gang = null) {
  const I = app.model.instances;
  const inst = I[id];
  if (!inst) return;
  const name = shortLabel(inst);
  if (is(inst, 'ProtectiveDevice')) {
    const closed = app.sim.breakers[id].closed;
    change((s) => (closed ? (s.breakers[id] = false) : delete s.breakers[id]), `${inst.attrs.label ?? name} ${closed ? 'išjungtas' : 'įjungtas'}`);
  } else if (is(inst, 'Switch')) {
    const gangs = gangCount(inst);
    const k = gang ?? 0;
    const values = Array.from({ length: gangs }, (_, i) => Boolean(app.state.switches[id]?.[i]));
    values[k] = !values[k];
    change((s) => (values.some(Boolean) ? (s.switches[id] = values) : delete s.switches[id]), `Jungiklis ${name}${gangs > 1 ? ` (${k + 1})` : ''}: ${values[k] ? 'įjungta' : 'išjungta'}`);
  } else if ((is(inst, 'Light') || is(inst, 'CableEnd')) && app.sim.switchesOf[id]?.length) {
    // A light with a switch is turned on and off with (its first) switch.
    const { sw, gang: g } = app.sim.switchesOf[id][0];
    toggle(sw.id, g);
  } else if (is(inst, 'PowerStrip')) {
    const on = app.sim.devices[id].on;
    change((s) => (on ? (s.devices[id] = false) : delete s.devices[id]), `${name} ${on ? 'išjungtas' : 'įjungtas'}`);
  } else if (is(inst, 'Load')) {
    const on = app.sim.devices[id].on;
    change((s) => (on ? delete s.devices[id] : (s.devices[id] = true)), `${name} ${on ? 'išjungtas' : 'įjungtas'}`);
  }
}

function resetState(kind) {
  const I = app.model.instances;
  change((s) => {
    s.switches = {};
    s.devices = {};
    s.breakers = {};
    if (kind !== 'all-on') return;
    // Peak load: every appliance on, and every light and switched cable end lit.
    // Two-way switches toggle together, so in each group only the first is set on.
    for (const inst of Object.values(I)) {
      if (is(inst, 'Load') && !is(inst, 'PowerStrip') && !app.sim.switchesOf[inst.id]?.length) s.devices[inst.id] = true;
    }
    for (const [, sws] of Object.entries(app.sim.switchesOf)) {
      const multiway = sws.filter(({ sw }) => ['twoWay', 'intermediate'].includes(sw.attrs.switchType));
      const pick = multiway.length ? [multiway[0]] : sws;
      for (const { sw, gang } of pick) {
        const values = s.switches[sw.id] ?? Array.from({ length: gangCount(sw) }, () => false);
        values[gang] = true;
        s.switches[sw.id] = values;
      }
    }
  }, kind === 'all-on' ? 'Viskas įjungta: didžiausios apkrovos testas' : 'Visi prietaisai ir jungikliai išjungti, saugikliai įjungti');
}

function toast(title, gained, lost) {
  const el = $('toast');
  const I = app.model.instances;
  const room = (id) => I[id]?.parent && is(I[I[id].parent], 'Room') ? ` (${shortName(I[I[id].parent])})` : '';
  const list = (ids) => ids.slice(0, 8).map((id) => escapeHtml(`${shortLabel(I[id])}${is(I[id], 'Load') && !is(I[id], 'Light') ? '' : room(id)}`)).join(', ');
  const more = (ids) => (ids.length > 8 ? ` +${ids.length - 8}` : '');
  const g = gained.filter((id) => !is(I[id], 'Switch'));
  const l = lost.filter((id) => !is(I[id], 'Switch'));
  el.innerHTML = `<strong>${escapeHtml(title)}</strong>
    ${g.length ? `<div class="gain">● Gavo įtampą (${g.length}): ${list(g)}${more(g)}</div>` : ''}
    ${l.length ? `<div class="loss">● Liko be įtampos (${l.length}): ${list(l)}${more(l)}</div>` : ''}`;
  el.hidden = false;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

// ------------------------------------------------------------------ data

function receive(state) {
  app.connected = true;
  app.error = state.error;
  app.tool = state.tool;
  if (state.model) {
    app.model = state.model;
    app.sim = simulate(app.model, app.state, app.tool?.rollup ?? null);
    const layout = layoutPlan(app.model);
    if (!app.viewBox || JSON.stringify(layout.bounds) !== JSON.stringify(app.layout?.bounds)) app.viewBox = { ...layout.bounds };
    app.layout = layout;
    if (app.selected && !app.model.instances[app.selected]) app.selected = null;
  }
  app.updatedAt = new Date();
  render();
}

function connect() {
  // ?once loads a single snapshot (no live connection), e.g. for screenshots.
  if (new URLSearchParams(location.search).has('once')) {
    fetch('/api/model').then((r) => r.json()).then(receive);
    return;
  }
  const source = new EventSource('/api/events');
  source.addEventListener('model', (e) => receive(JSON.parse(e.data)));
  source.onerror = () => {
    app.connected = false;
    renderStatus();
  };
}

// ------------------------------------------------------------------ focus

function focusFor(id) {
  const { model, sim } = app;
  if (!id || !model) return { focus: null, links: [] };
  const I = model.instances;
  const inst = I[id];
  const focus = new Set([id]);
  const links = [];
  const addChain = (breakerId) => sim.protectiveChain(breakerId).forEach((p) => focus.add(p));

  if (is(inst, 'ProtectiveDevice')) {
    for (const b of Object.keys(sim.breakers)) if (sim.protectiveChain(b).includes(id)) focus.add(b);
    addChain(id);
    for (const d of sim.breakers[id].devices) focus.add(d);
  } else if (is(inst, 'Room')) {
    for (const d of Object.keys(sim.devices)) if (d.startsWith(`${id}.`)) focus.add(d);
  } else {
    const d = sim.devices[id];
    if (d?.breaker) addChain(d.breaker);
    d?.via.forEach((v) => focus.add(v));
    for (const c of d?.controlledBy ?? []) {
      focus.add(c);
      links.push([c, id]);
    }
    for (const c of inst.refs.controls ?? []) {
      focus.add(c);
      links.push([id, c]);
    }
    for (const p of inst.refs.pluggedIn ?? []) focus.add(p);
    for (const c of inst.children) focus.add(c);
  }
  return { focus, links };
}

function select(id) {
  app.selected = id;
  render();
}

// ------------------------------------------------------------------ render

function render() {
  renderStatus();
  if (!app.model) return;
  const { focus, links } = focusFor(app.hover ?? app.selected);
  const view = { selected: app.selected, focus, links, flash: app.flash };
  renderPlan($('plan'), app.model, app.sim, app.layout, view);
  applyViewBox();
  renderPanel($('panel'), app.model, app.sim, view);
  renderPhases($('phases'), app.sim);
  renderKpis();
  renderInspector();
  renderChecks();
  renderSpares();
}

function renderStatus() {
  const el = $('status');
  el.className = `status ${app.connected ? (app.error ? 'error' : 'ok') : 'offline'}`;
  el.querySelector('.text').textContent = !app.connected
    ? 'Neprisijungta, bandoma iš naujo…'
    : app.error
      ? 'Modelyje klaida'
      : `Modelis gyvai · ${app.updatedAt?.toLocaleTimeString('lt-LT') ?? ''}`;
  const banner = $('banner');
  banner.hidden = !app.error;
  if (app.error) banner.innerHTML = `<strong>Modelio nepavyko perskaityti.</strong> Rodoma paskutinė veikianti versija.<code>${escapeHtml(app.error)}</code>`;
}

function renderKpis() {
  const { sim } = app;
  const unknown = sim.unknownActive.length;
  const off = Object.values(sim.breakers).filter((b) => !b.closed).length;
  $('kpis').innerHTML = `
    <div class="kpi"><span>Dabar naudojama</span><strong>${fmtPower(sim.totalW)}</strong></div>
    ${PHASES.map((ph) => `<div class="kpi"><span><i class="ph ${ph}">${ph}</i></span><strong>${fmtCurrent(sim.phases[ph] / 230)}</strong></div>`).join('')}
    ${off ? `<div class="kpi bad"><span>Išjungta saugiklių</span><strong>${off}</strong></div>` : ''}
    ${unknown ? `<div class="kpi warn" title="Įjungti prietaisai, kurių galia modelyje nežinoma"><span>Nežinoma galia</span><strong>${unknown}</strong></div>` : ''}`;
}

function sourceLink(inst) {
  return inst.source ? `<span class="src">${escapeHtml(inst.source.file)}:${inst.source.line}</span>` : '';
}

function chip(id) {
  const inst = app.model.instances[id];
  if (!inst) return '';
  const d = app.sim.devices[id];
  const state = d ? (d.active ? 'on' : d.live ? 'live' : 'dead') : '';
  return `<button class="chip ${state}" data-select="${id}">${escapeHtml(displayName(inst))}</button>`;
}

const HIDDEN_ATTRS = new Set(['label', 'name', 'planX', 'planY', 'planWidth', 'planDepth', 'product', 'connectedLoad', 'feedLoad',
  'downstreamLoad', 'downstreamLoadL1', 'downstreamLoadL2', 'downstreamLoadL3', 'connectedLoadL1', 'connectedLoadL2', 'connectedLoadL3']);
const ATTR_NAMES = {
  power: 'Galia', socketCount: 'Lizdų', hasEarth: 'Įžeminimas', isWaterproof: 'Drėgmei atspari', hasDataSocket: 'RJ45 lizdas',
  bulbSocketCount: 'Lempučių lizdų', lengthM: 'Ilgis, m', switchType: 'Jungiklio tipas', phases: 'Fazių', tripCurve: 'Charakteristika',
  ratedCurrent: 'Vardinė srovė', breakingCapacity: 'Atjungimo geba', poles: 'Polių', phase: 'Fazė', residualCurrent: 'Nuotėkio srovė',
  rcdType: 'RCD tipas', nominalVoltage: 'Įtampa', area: 'Plotas', cableCrossSectionMm2: 'Kabelis, mm²', notes: 'Pastabos',
};

function attrTable(inst) {
  const rows = Object.entries(inst.attrs)
    .filter(([k]) => !HIDDEN_ATTRS.has(k))
    .map(([k, v]) => `<tr><th>${escapeHtml(ATTR_NAMES[k] ?? k)}</th><td>${escapeHtml(fmtValue(v))}${inst.ownAttrs.includes(k) ? '' : ' <small class="muted">numatyta</small>'}</td></tr>`);
  return rows.length ? `<table class="attrs">${rows.join('')}</table>` : '';
}

function toggleButton(id, on, labels = ['Įjungti', 'Išjungti']) {
  return `<button class="toggle ${on ? 'on' : ''}" data-toggle="${id}"><span class="knob"></span>${on ? labels[1] : labels[0]}</button>`;
}

function renderInspector() {
  const el = $('inspector');
  const { model, sim } = app;
  $('clear-selection').hidden = !app.selected;
  if (!app.selected) {
    $('inspector-title').textContent = 'Detalės';
    el.innerHTML = '<p class="muted">Spustelėkite saugiklį, jungiklį, lempą ar prietaisą: jis bus įjungtas arba išjungtas. Su <kbd>Shift</kbd> tik pasirenkama.</p>';
    return;
  }
  const I = model.instances;
  const inst = I[app.selected];
  $('inspector-title').textContent = displayName(inst);
  const parts = [`<div class="type-line"><span class="badge">${escapeHtml(inst.type ?? 'part')}</span>${sourceLink(inst)}</div>`];
  if (inst.doc) parts.push(`<p class="doc">${escapeHtml(inst.doc)}</p>`);

  if (is(inst, 'ProtectiveDevice')) {
    const b = sim.breakers[inst.id];
    parts.push(`<div class="actions">${toggleButton(inst.id, b.closed)}</div>`);
    parts.push(`<div class="stats">
      <div><span>Būsena</span><strong class="${b.closed && b.energized ? 'good' : 'bad'}">${!b.closed ? 'Išjungtas' : b.energized ? 'Įjungtas' : 'Be įtampos iš viršaus'}</strong></div>
      <div><span>Dabar</span><strong class="${b.overloaded ? 'bad' : ''}">${fmtPower(b.loadW)} · ${fmtCurrent(b.currentA)}${b.ratedA ? ` / ${b.ratedA} A` : ''}</strong></div>
      <div><span>Prijungta galia</span><strong>${fmtPower(b.connectedW)}</strong><small class="muted">${b.connectedFromTool ? 'SysML' : 'naršyklė'}</small></div>
    </div>`);
    if (b.overloaded) parts.push('<p class="alert">Srovė viršija vardinę: tikrovėje šis saugiklis išsijungtų.</p>');
    const byRoom = {};
    for (const id of b.devices.filter((d) => !is(I[d], 'Switch'))) {
      const room = roomOf(model, id);
      (byRoom[room?.doc ?? 'Kita'] ??= []).push(id);
    }
    parts.push(`<h4>Maitina (${Object.values(byRoom).flat().length})</h4>`);
    for (const [room, ids] of Object.entries(byRoom)) parts.push(`<div class="group"><span>${escapeHtml(room)}</span><div class="chips">${ids.map(chip).join('')}</div></div>`);
  } else if (is(inst, 'Room')) {
    const ids = Object.keys(sim.devices).filter((d) => d.startsWith(`${inst.id}.`));
    const w = ids.reduce((s, id) => s + sim.devices[id].power, 0);
    parts.push(`<div class="stats"><div><span>Prietaisų</span><strong>${ids.length}</strong></div><div><span>Dabar naudoja</span><strong>${fmtPower(w)}</strong></div></div>`);
    parts.push(`<div class="chips">${ids.map(chip).join('')}</div>`);
  } else if (sim.devices[inst.id]) {
    const d = sim.devices[inst.id];
    const path = d.breaker ? [...sim.protectiveChain(d.breaker).reverse(), ...[...d.via].reverse(), inst.id] : [];
    if (is(inst, 'Switch')) {
      const gangs = gangCount(inst);
      parts.push(`<div class="actions">${Array.from({ length: gangs }, (_, k) => {
        const target = inst.refs.controls?.[gangs > 1 ? k : 0];
        const on = Boolean(app.state.switches[inst.id]?.[k]);
        return `<button class="toggle ${on ? 'on' : ''}" data-toggle="${inst.id}" data-gang="${k}"><span class="knob"></span>${gangs > 1 ? escapeHtml(I[target]?.attrs.label ?? `${k + 1}`) : on ? 'Išjungti' : 'Įjungti'}</button>`;
      }).join('')}</div>`);
    } else if (is(inst, 'Load') || is(inst, 'CableEnd')) {
      parts.push(`<div class="actions">${toggleButton(inst.id, d.on)}${d.hasSwitch ? '<span class="muted small">per jungiklį</span>' : ''}</div>`);
    }
    parts.push(`<div class="stats">
      <div><span>Įtampa</span><strong class="${d.live ? 'good' : 'bad'}">${d.live ? 'Yra' : d.fed ? 'Nėra' : 'Ne iš skydelio'}</strong></div>
      ${is(inst, 'Load') ? `<div><span>Veikia</span><strong>${d.active ? 'Taip' : d.on ? 'Įjungtas, bet be įtampos' : 'Ne'}</strong></div>
      <div><span>Galia</span><strong>${d.powerUnknown ? 'nežinoma' : fmtPower(d.ratedPower)}</strong></div>` : ''}
    </div>`);
    if (path.length) parts.push(`<h4>Maitinimo kelias</h4><div class="path">${path.map(chip).join('<span class="arrow">›</span>')}</div>`);
    if (inst.attrs.product) parts.push(`<p class="product">${escapeHtml(inst.attrs.product)}</p>`);
    const bulbs = sim.bulbsOf(inst);
    if (bulbs.length) {
      parts.push(`<h4>Lemputės</h4><table class="attrs">${bulbs.map((b) => `<tr><th>${b.count} × ${escapeHtml(b.attrs.product ?? b.type)}</th><td>${fmtValue(b.attrs.power)} · ${fmtValue(b.attrs.luminousFlux)} lm · ${fmtValue(b.attrs.colorTemperature)}</td></tr>`).join('')}</table>`);
    }
    if (inst.refs.pluggedIn?.length) parts.push(`<h4>Įjungta</h4><div class="chips">${inst.refs.pluggedIn.map(chip).join('')}</div>`);
    if (inst.refs.controls?.length) parts.push(`<h4>Valdo</h4><div class="chips">${inst.refs.controls.map(chip).join('')}</div>`);
    if (d.controlledBy.length) parts.push(`<h4>Valdomas</h4><div class="chips">${d.controlledBy.map(chip).join('')}</div>`);
  }
  parts.push(attrTable(inst));
  for (const c of inst.comments) parts.push(`<p class="comment">${escapeHtml(c)}</p>`);
  el.innerHTML = parts.join('');
}

function renderChecks() {
  const el = $('checks');
  const tool = app.tool;
  if (!tool?.available) {
    $('tool-version').textContent = '';
    el.innerHTML = '<p class="muted">OpenSysML įrankis (<code>sysml</code>) nerastas: patikra neatlikta, prijungtą galią skaičiuoja naršyklė.</p>';
    return;
  }
  $('tool-version').textContent = tool.version;
  const diags = tool.validation?.diagnostics ?? [];
  const errors = diags.filter((d) => d.severity === 'error');
  const byCode = {};
  for (const w of diags.filter((d) => d.severity !== 'error')) (byCode[w.code] ??= []).push(w);
  const q1 = app.sim.mains.map((id) => app.sim.breakers[id]);
  el.innerHTML = `
    <div class="check-row ${errors.length ? 'bad' : 'good'}"><strong>${errors.length ? `${errors.length} klaid.` : 'Klaidų nėra'}</strong><span>sysml -validate</span></div>
    ${errors.map((d) => `<div class="diag error"><code>${escapeHtml(d.file)}:${d.line}</code> ${escapeHtml(d.message)}</div>`).join('')}
    ${Object.entries(byCode).map(([code, list]) => `<details class="diag warning"><summary>${list.length} × ${escapeHtml(code)}</summary><p>${escapeHtml(list[0].message)}</p>${list.map((d) => `<div><code>${escapeHtml(d.file)}:${d.line}</code></div>`).join('')}</details>`).join('')}
    ${q1.map((b) => `<div class="check-row"><strong>Prijungta galia: ${fmtPower(b.connectedW)}</strong><span>connectedLoad</span></div>`).join('')}
    ${tool.rollupError ? `<div class="diag error">${escapeHtml(tool.rollupError)}</div>` : ''}`;
}

function renderSpares() {
  const boxes = Object.values(app.model.instances).filter((i) => is(i, 'SpareBulbBox'));
  $('spares-card').hidden = !boxes.length;
  $('spares').innerHTML = boxes
    .map((box) => `<table class="attrs">${app.sim.bulbsOf(box).map((b) => `<tr><th>${b.count} × ${escapeHtml(b.attrs.base ?? '')}</th><td>${escapeHtml(b.attrs.product ?? b.type)} · ${fmtValue(b.attrs.power)}</td></tr>`).join('')}</table>`)
    .join('');
}

// ------------------------------------------------------------------ interaction

function activate(target, e) {
  const id = target.dataset.id;
  const inst = app.model.instances[id];
  if (!inst) return;
  app.selected = id;
  if (e.shiftKey || is(inst, 'Room')) {
    render();
    return;
  }
  const gangEl = e.target.closest('[data-gang]');
  toggle(id, gangEl ? Number(gangEl.dataset.gang) : null);
}

function applyViewBox() {
  const v = app.viewBox;
  if (!v) return;
  const svg = $('plan');
  svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
  const b = app.layout.bounds;
  svg.style.aspectRatio = `${b.w} / ${b.h}`;
}

function setupPlan() {
  const svg = $('plan');
  const scaleOf = () => {
    const r = svg.getBoundingClientRect();
    return Math.max(app.viewBox.w / r.width, app.viewBox.h / r.height);
  };
  svg.addEventListener('wheel', (e) => {
    if (!app.viewBox) return;
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    const v = app.viewBox;
    const scale = scaleOf();
    const px = v.x - (r.width * scale - v.w) / 2 + (e.clientX - r.left) * scale;
    const py = v.y - (r.height * scale - v.h) / 2 + (e.clientY - r.top) * scale;
    const k = Math.exp(e.deltaY * 0.0015);
    app.viewBox = { x: px - (px - v.x) * k, y: py - (py - v.y) * k, w: v.w * k, h: v.h * k };
    applyViewBox();
  }, { passive: false });

  let drag = null;
  svg.addEventListener('pointerdown', (e) => {
    if (app.viewBox) drag = { x0: e.clientX, y0: e.clientY, moved: false, v: { ...app.viewBox }, scale: scaleOf() };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 4) drag.moved = true;
    if (!drag.moved) return;
    app.viewBox = { ...drag.v, x: drag.v.x - (e.clientX - drag.x0) * drag.scale, y: drag.v.y - (e.clientY - drag.y0) * drag.scale };
    applyViewBox();
  });
  window.addEventListener('pointerup', (e) => {
    if (drag && !drag.moved && svg.contains(e.target)) {
      const target = e.target.closest('[data-id]');
      if (target) activate(target, e);
      else select(null);
    }
    drag = null;
  });
  $('reset-view').addEventListener('click', () => {
    app.viewBox = { ...app.layout.bounds };
    applyViewBox();
  });
}

// Panel, inspector and other controls outside the plan.
document.addEventListener('click', (e) => {
  if ($('plan').contains(e.target)) return;
  const t = e.target.closest('[data-toggle]');
  if (t) {
    toggle(t.dataset.toggle, t.dataset.gang != null ? Number(t.dataset.gang) : null);
    return;
  }
  const s = e.target.closest('[data-select]');
  if (s) {
    select(s.dataset.select);
    return;
  }
  const b = e.target.closest('#panel [data-id]');
  if (b) activate(b, e);
});
// Hovering a breaker previews the group of devices it feeds.
$('panel').addEventListener('pointerover', (e) => {
  const id = e.target.closest('[data-id]')?.dataset.id ?? null;
  if (id !== app.hover) {
    app.hover = id;
    render();
  }
});
$('panel').addEventListener('pointerleave', () => {
  app.hover = null;
  render();
});
$('clear-selection').addEventListener('click', () => select(null));
$('all-off').addEventListener('click', () => resetState('all-off'));
$('all-on').addEventListener('click', () => resetState('all-on'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') select(null);
});

setupPlan();
connect();
