// Floor plan: room rectangles from the rooms' plan attributes and device
// positions (explicit planX/planY, otherwise placed automatically:
// outlets/switches along the walls, lights in the middle, appliances
// next to the outlet they are plugged into).

import { is, num, gangCount } from './simulate.js';
import { fmtPower, shortName, escapeHtml } from './format.js';

const CM = 100; // model is in metres, the SVG in centimetres
const WALL_TYPES = ['Outlet', 'Switch', 'Thermostat', 'CableEnd'];
const INSET = 30;

export function layoutPlan(model) {
  const I = model.instances;
  const rooms = Object.values(I).filter((i) => is(i, 'Room'));
  const placed = [];
  let autoX = 0;
  for (const r of rooms) {
    const a = r.attrs;
    const w = (num(a.planWidth) ?? 4) * CM;
    const h = (num(a.planDepth) ?? num(a.planWidth) ?? 4) * CM;
    let x = num(a.planX);
    let y = num(a.planY);
    if (x == null || y == null) {
      // No placement in the model: put the room in a row below the others.
      x = autoX / CM;
      y = 12;
      autoX += w + 50;
    }
    placed.push({ id: r.id, name: r.doc ?? r.name, x: x * CM, y: y * CM, w, h });
  }

  const pos = {};
  for (const room of placed) {
    layoutRoom(model, room, pos);
    relaxChips(model, room, pos);
  }

  const minX = Math.min(...placed.map((r) => r.x)) - 60;
  const minY = Math.min(...placed.map((r) => r.y)) - 60;
  const maxX = Math.max(...placed.map((r) => r.x + r.w)) + 60;
  const maxY = Math.max(...placed.map((r) => r.y + r.h)) + 60;
  return { rooms: placed, pos, bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } };
}

function perimeterPoint(rx, ry, w, h, t, skip = 0) {
  // t in [0, 1): clockwise along the walls from the top-left corner, leaving out
  // the first `skip` cm (room name); returns the point and the inward normal.
  const p = 2 * (w + h);
  let d = skip + t * (p - skip);
  if (d < w) return { x: rx + d, y: ry, nx: 0, ny: 1 };
  d -= w;
  if (d < h) return { x: rx + w, y: ry + d, nx: -1, ny: 0 };
  d -= h;
  if (d < w) return { x: rx + w - d, y: ry + h, nx: 0, ny: -1 };
  d -= w;
  return { x: rx, y: ry + h - d, nx: 1, ny: 0 };
}

function layoutRoom(model, room, pos) {
  const I = model.instances;
  const devices = room.children ?? I[room.id].children.map((c) => I[c]).filter((c) => is(c, 'ElectricalDevice'));
  const explicit = (d) => num(d.attrs.planX) != null && num(d.attrs.planY) != null;
  for (const d of devices) {
    if (explicit(d)) pos[d.id] = { x: room.x + num(d.attrs.planX) * CM, y: room.y + num(d.attrs.planY) * CM, nx: 0, ny: 1 };
  }

  const ix = room.x + INSET;
  const iy = room.y + INSET;
  const iw = room.w - 2 * INSET;
  const ih = room.h - 2 * INSET;

  const wall = devices.filter((d) => WALL_TYPES.some((t) => is(d, t)) && !explicit(d));
  wall.forEach((d, i) => {
    pos[d.id] = perimeterPoint(ix, iy, iw, ih, (i + 0.5) / wall.length, Math.min(300, iw * 0.45));
  });

  const lights = devices.filter((d) => is(d, 'Light') && !explicit(d));
  const cols = Math.ceil(Math.sqrt(lights.length));
  const rows = Math.ceil(lights.length / Math.max(cols, 1));
  lights.forEach((d, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    pos[d.id] = {
      x: room.x + room.w / 2 + (c - (cols - 1) / 2) * (room.w * 0.42 / Math.max(cols, 1)),
      y: room.y + room.h * 0.42 + (r - (rows - 1) / 2) * (room.h * 0.3 / Math.max(rows, 1)),
      nx: 0,
      ny: 1,
    };
  });

  const fixed = devices.filter((d) => is(d, 'FixedAppliance') && !explicit(d));
  fixed.forEach((d, i) => {
    pos[d.id] = {
      x: room.x + room.w * ((i + 0.5) / fixed.length),
      y: room.y + room.h * 0.74,
      nx: 0,
      ny: 1,
    };
  });
  // Lights belonging to an appliance (e.g. the hood light) sit next to it.
  for (const f of fixed) {
    for (const c of f.children.map((id) => I[id]).filter((c) => is(c, 'Light'))) {
      if (!explicit(c)) pos[c.id] = { x: pos[f.id].x, y: pos[f.id].y - 52, nx: 0, ny: 1 };
    }
  }

  // Plugged appliances stack inward from their outlet (or power strip).
  const placePlugged = (hostId, depth) => {
    const host = pos[hostId];
    (I[hostId].refs.pluggedIn ?? []).forEach((a) => {
      if (!I[a] || explicit(I[a])) return;
      depth += 1;
      pos[a] = { x: host.x + host.nx * (30 + depth * 40), y: host.y + host.ny * (30 + depth * 40), nx: host.nx, ny: host.ny };
      if (I[a].refs.pluggedIn?.length) {
        pos[a].anchor = hostId;
        placeStripChildren(a, depth);
        depth += I[a].refs.pluggedIn.length;
      } else {
        pos[a].anchor = hostId;
      }
    });
  };
  const placeStripChildren = (stripId, depth) => {
    const strip = pos[stripId];
    I[stripId].refs.pluggedIn.forEach((a, k) => {
      if (!I[a] || explicit(I[a])) return;
      pos[a] = { x: strip.x + strip.nx * (40 * (k + 1)), y: strip.y + strip.ny * (40 * (k + 1)), nx: strip.nx, ny: strip.ny, anchor: stripId };
    });
  };
  for (const d of devices) if (is(d, 'Outlet') && pos[d.id]) placePlugged(d.id, 0);

  // Appliances not plugged anywhere: a row near the top of the room.
  const loose = devices.filter((d) => is(d, 'PluggedAppliance') && !pos[d.id]);
  loose.forEach((d, i) => {
    pos[d.id] = { x: room.x + room.w * ((i + 0.5) / loose.length), y: room.y + room.h * 0.2, nx: 0, ny: 1 };
  });
}

// Size of an appliance chip, as drawn by deviceSvg.
export function chipWidth(inst) {
  return 52 + Math.max(shortName(inst).length * 8.6, 40);
}
const CHIP_H = 38;
const ICON = 46;

// Push automatically placed appliance chips apart so they do not overlap
// each other or the fixed icons, keeping them inside the room.
function relaxChips(model, room, pos) {
  const I = model.instances;
  const ids = Object.keys(pos).filter((id) => id.startsWith(`${room.id}.`));
  const box = (id) => {
    const inst = I[id];
    const chip = is(inst, 'PluggedAppliance') || is(inst, 'FixedAppliance');
    return { id, chip, movable: chip && !(num(inst.attrs.planX) != null), w: chip ? chipWidth(inst) : ICON, h: chip ? CHIP_H : ICON };
  };
  const boxes = ids.map(box);
  const pad = 6;
  for (let iter = 0; iter < 80; iter++) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (!a.movable && !b.movable) continue;
        const pa = pos[a.id];
        const pb = pos[b.id];
        const ox = (a.w + b.w) / 2 + pad - Math.abs(pa.x - pb.x);
        const oy = (a.h + b.h) / 2 + pad - Math.abs(pa.y - pb.y);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        // Separate along the axis of least overlap.
        const share = a.movable && b.movable ? 0.5 : 1;
        if (ox < oy) {
          const d = (ox + 0.5) * share * (pa.x < pb.x ? -1 : 1);
          if (a.movable) pa.x += d;
          if (b.movable) pb.x -= d;
        } else {
          const d = (oy + 0.5) * share * (pa.y < pb.y ? -1 : 1);
          if (a.movable) pa.y += d;
          if (b.movable) pb.y -= d;
        }
      }
    }
    for (const b of boxes) {
      if (!b.movable) continue;
      const p = pos[b.id];
      p.x = Math.min(Math.max(p.x, room.x + b.w / 2 + 8), room.x + room.w - b.w / 2 - 8);
      p.y = Math.min(Math.max(p.y, room.y + 56 + b.h / 2), room.y + room.h - b.h / 2 - 8);
    }
    if (!moved) break;
  }
}

// ------------------------------------------------------------------ render
//
// Symbols follow the installation plan symbols of IEC 60617 as used on
// electrical floor plans: socket outlet with protective contact, switches
// (one-way, two-way, series), luminaire (circle with a cross), line
// luminaire for LED strips, heater, and equipment boxes for appliances.

const PHASE_COLOR = { L1: 'var(--l1)', L2: 'var(--l2)', L3: 'var(--l3)' };

export function renderPlan(svg, model, sim, layout, view) {
  const I = model.instances;
  const { rooms, pos } = layout;
  const focus = view.focus;
  const cls = (id) => `${focus && !focus.has(id) ? ' dim' : ''}${view.selected === id ? ' selected' : ''}${view.flash?.[id] ? ` flash-${view.flash[id]}` : ''}`;
  const out = [];

  out.push(`<defs>
    <radialGradient id="glow"><stop offset="0" stop-color="var(--glow)" stop-opacity=".5"/><stop offset=".5" stop-color="var(--glow)" stop-opacity=".14"/><stop offset="1" stop-color="var(--glow)" stop-opacity="0"/></radialGradient>
    <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" class="hatch-line"/></pattern>
  </defs>`);

  for (const r of rooms) {
    const roomW = Object.values(sim.devices).filter((d) => d.power && d.id.startsWith(`${r.id}.`)).reduce((s, d) => s + d.power, 0);
    out.push(`<g class="room${view.selected === r.id ? ' selected' : ''}" data-id="${r.id}">
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>
      <text class="room-name" x="${r.x + 20}" y="${r.y + 36}">${escapeHtml(r.name)}</text>
      <text class="room-load" x="${r.x + 20}" y="${r.y + 62}">${roomW ? fmtPower(roomW) : ''}</text>
    </g>`);
  }

  for (const [id, p] of Object.entries(pos)) {
    const d = sim.devices[id];
    if (!d?.active || !is(I[id], 'Light')) continue;
    const lumens = sim.bulbsOf(I[id]).reduce((s, b) => s + b.count * (num(b.attrs.luminousFlux) ?? 0), 0) || (d.ratedPower || 10) * 90;
    out.push(`<circle class="halo${focus && !focus.has(id) ? ' dim' : ''}" cx="${p.x}" cy="${p.y}" r="${Math.min(80 + Math.sqrt(lumens) * 3.4, 280)}" fill="url(#glow)"/>`);
  }

  for (const [id, p] of Object.entries(pos)) {
    if (!p.anchor || !pos[p.anchor]) continue;
    const a = pos[p.anchor];
    const d = sim.devices[id];
    const phase = d?.breaker ? sim.phaseOf(d.breaker) : null;
    out.push(`<line class="cord${d?.live ? ' live' : ''}${focus && !focus.has(id) ? ' dim' : ''}" style="--phase:${PHASE_COLOR[phase] ?? 'var(--muted)'}" x1="${a.x}" y1="${a.y}" x2="${p.x}" y2="${p.y}"/>`);
  }
  for (const [from, to] of view.links ?? []) {
    if (pos[from] && pos[to]) out.push(`<line class="link" x1="${pos[from].x}" y1="${pos[from].y}" x2="${pos[to].x}" y2="${pos[to].y}"/>`);
  }

  const order = (id) => (is(I[id], 'PluggedAppliance') || is(I[id], 'FixedAppliance') ? 1 : 0);
  for (const id of Object.keys(pos).sort((a, b) => order(a) - order(b))) {
    const inst = I[id];
    const d = sim.devices[id];
    if (inst && d) out.push(deviceSvg(inst, d, pos[id], sim, cls(id)));
  }
  svg.innerHTML = out.join('\n');
}

// Rotation that puts the symbol's wall side (drawn at -y) against the wall.
const wallAngle = (p) => (Math.atan2(p.ny, p.nx) * 180) / Math.PI - 90;

function stateClass(d) {
  if (!d.fed) return ' unfed';
  return `${d.live ? ' avail' : ' unavail'}${d.active ? ' on' : ''}`;
}

function deviceSvg(inst, d, p, sim, extra) {
  const label = escapeHtml(inst.attrs.label ?? '');
  const phase = d.breaker ? sim.phaseOf(d.breaker) : null;
  const style = ` style="--phase:${PHASE_COLOR[phase] ?? 'var(--three-phase)'}"`;
  // The symbol turns with the wall it is mounted on; `after` (labels) stays upright.
  const g = (kind, body, rotate = false, after = '') =>
    `<g class="dev ${kind}${stateClass(d)}${extra}" data-id="${inst.id}" transform="translate(${p.x} ${p.y})"${style}>` +
    `${rotate ? `<g transform="rotate(${wallAngle(p)})">${body}</g>` : body}${after}</g>`;
  // Labels go on the room side of a wall symbol.
  const tag = (text, dist = 46) => `<text class="tag" x="${p.nx * dist}" y="${p.ny * dist + 6}">${text}</text>`;

  if (is(inst, 'Light')) {
    const length = num(inst.attrs.lengthM);
    const n = sim.bulbsOf(inst).reduce((s, b) => s + b.count, 0);
    const sockets = num(inst.attrs.bulbSocketCount) ?? 1;
    if (length) {
      // Line luminaire (LED strip), drawn to its length.
      const half = Math.min(length * CM, 360) / 2;
      return g('light strip', `<rect class="hit" x="${-half}" y="-14" width="${half * 2}" height="28"/>
        <line class="sym" x1="${-half}" y1="0" x2="${half}" y2="0"/>
        <line class="sym" x1="${-half}" y1="-9" x2="${-half}" y2="9"/><line class="sym" x1="${half}" y1="-9" x2="${half}" y2="9"/>
        <text class="tag" y="34">${label}</text>`);
    }
    return g('light', `<circle class="hit" r="30"/>
      <circle class="sym lamp" r="20"/>
      <path class="sym" d="M-14.1 -14.1 L14.1 14.1 M14.1 -14.1 L-14.1 14.1"/>
      <text class="tag" y="46">${label}</text>
      ${sockets > 1 ? `<text class="count" x="24" y="-18">${n < sockets ? `${n}/${sockets}` : `×${sockets}`}</text>` : ''}`);
  }
  if (is(inst, 'Outlet')) {
    const sockets = num(inst.attrs.socketCount) ?? 1;
    const used = (inst.refs.pluggedIn ?? []).length;
    // Socket outlet with protective contact; one dome per socket.
    const domes = Array.from({ length: Math.min(sockets, 3) }, (_, k) => {
      const x = (k - (Math.min(sockets, 3) - 1) / 2) * 30;
      return `<path class="sym" d="M${x - 13} 24 A13 13 0 0 1 ${x + 13} 24 Z"/><line class="sym" x1="${x}" y1="0" x2="${x}" y2="11"/><line class="sym" x1="${x - 13}" y1="11" x2="${x + 13}" y2="11"/>`;
    }).join('');
    const marks = [
      inst.attrs.isWaterproof ? '<text class="mark" x="0" y="44">IP44</text>' : '',
      inst.attrs.hasDataSocket ? `<g class="data"><path class="sym" d="M${Math.min(sockets, 3) * 15 + 6} 24 l10 -16 l10 16 z"/><text class="mark" x="${Math.min(sockets, 3) * 15 + 16}" y="38">TP</text></g>` : '',
    ].join('');
    return g('outlet', `<rect class="hit" x="${-Math.min(sockets, 3) * 15 - 6}" y="-4" width="${Math.min(sockets, 3) * 30 + 12}" height="34"/>${domes}${marks}`, true,
      tag(`${label}${used < sockets ? `<tspan class="free"> ${'○'.repeat(Math.min(sockets - used, 3))}</tspan>` : ''}`, 52));
  }
  if (is(inst, 'Switch')) {
    const type = inst.attrs.switchType;
    const gangs = gangCount(inst);
    const lever = (k, angle) => {
      const on = (gangs === 1 ? d.on : Boolean(sim.devices[inst.refs.controls?.[k]]?.on)) ? ' up' : '';
      const r = (angle * Math.PI) / 180;
      const x = Math.sin(r) * 26;
      const y = Math.cos(r) * 26;
      const tx = Math.cos(r) * 6;
      const ty = -Math.sin(r) * 6;
      return `<g class="gang${on}" data-gang="${k}"><line class="hit-line" x1="0" y1="0" x2="${x}" y2="${y}"/>
        <line class="sym" x1="${Math.sin(r) * 6}" y1="${Math.cos(r) * 6}" x2="${x}" y2="${y}"/><line class="sym" x1="${x - tx}" y1="${y - ty}" x2="${x + tx}" y2="${y + ty}"/></g>`;
    };
    let levers;
    if (type === 'doubleGang') levers = lever(0, -30) + lever(1, 30);
    else if (type === 'twoWay' || type === 'intermediate') {
      // Two-way switch: the lever passes through the pivot with a tick at both ends.
      levers = lever(0, 35) + `<g class="gang${d.on ? ' up' : ''}"><line class="sym" x1="${-Math.sin(0.61) * 6}" y1="${-Math.cos(0.61) * 6}" x2="${-Math.sin(0.61) * 26}" y2="${-Math.cos(0.61) * 26}"/></g>`;
      if (type === 'intermediate') levers += lever(0, -35);
    } else levers = lever(0, 35);
    return g('switch', `<circle class="hit" r="30"/><circle class="sym pivot" cy="0" r="6"/>${levers}`, true, tag(label, 48));
  }
  if (is(inst, 'Thermostat')) {
    return g('thermostat', `<rect class="hit" x="-20" y="-20" width="40" height="40"/><rect class="sym" x="-15" y="-15" width="30" height="30"/><text class="glyph" y="7">θ</text>`, false, tag(label, 40));
  }
  if (is(inst, 'CableEnd')) {
    // Outlet box for a fixed connection.
    return g('cable', `<rect class="hit" x="-20" y="-6" width="40" height="34"/><rect class="sym" x="-12" y="6" width="24" height="18"/><line class="sym" x1="0" y1="0" x2="0" y2="6"/><path class="sym" d="M-12 6 L12 24 M12 6 L-12 24"/>`, true, tag(label, 50));
  }

  // Equipment: a box with the function symbol, then name and power.
  const name = escapeHtml(shortName(inst));
  const power = d.powerUnknown ? '? W' : d.ratedPower != null ? fmtPower(d.ratedPower) : '';
  const w = chipWidth(inst);
  const x0 = -w / 2;
  return g(`appliance${is(inst, 'PowerStrip') ? ' strip' : ''}`, `
    <rect class="chip" x="${x0}" y="-21" width="${w}" height="42" rx="6"/>
    <g transform="translate(${x0 + 21} 0)"><rect class="sym box" x="-15" y="-15" width="30" height="30"/>${glyph(inst)}</g>
    <text class="name" x="${x0 + 44}" y="-3">${name}</text>
    <text class="power" x="${x0 + 44}" y="13">${power}</text>`);
}

// Function symbol inside the equipment box (30 × 30, centred).
function glyph(inst) {
  const t = `${inst.name} ${inst.doc ?? ''}`.toLowerCase();
  const has = (...words) => words.some((w) => t.includes(w));
  if (is(inst, 'PowerStrip')) return '<path class="sym thin" d="M-9 0 h18 M-6 -4 v-4 M0 -4 v-4 M6 -4 v-4"/>';
  if (has('fridge', 'šaldytuv')) return '<path class="sym thin" d="M0 -10 V10 M-8.7 -5 L8.7 5 M-8.7 5 L8.7 -5"/>';
  if (has('hob', 'kaitlent')) return '<g class="sym thin">' + [[-6, -6], [6, -6], [-6, 6], [6, 6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5"/>`).join('') + '</g>';
  if (has('oven', 'orkait')) return '<rect class="sym thin" x="-9" y="-6" width="18" height="13"/><line class="sym thin" x1="-9" y1="-10" x2="9" y2="-10"/>';
  if (has('washing', 'skalbykl')) return '<circle class="sym thin" r="9"/><circle class="sym thin" r="3.5"/>';
  if (has('dishwasher', 'indaplov')) return '<path class="sym thin" d="M-9 -5 q4.5 -5 9 0 t9 0 M-9 3 q4.5 -5 9 0 t9 0"/>';
  if (has('microwave', 'mikrobang')) return '<path class="sym thin" d="M-10 0 q2.5 -7 5 0 t5 0 t5 0 t5 0"/>';
  if (has('towel', 'heating', 'gyvatuk', 'šildym')) return '<path class="sym thin" d="M-10 8 L-5 -8 L0 8 L5 -8 L10 8"/>';
  if (has('hood', 'gartrauk')) return '<circle class="sym thin" r="3"/><path class="sym thin" d="M0 -3 C4 -12 10 -6 3 -1 M0 3 C-4 12 -10 6 -3 1"/>';
  if (has('kettle', 'coffee', 'arbatin', 'kavos')) return '<path class="sym thin" d="M-7 -2 h14 v9 h-14 z M-3 -6 v-3 M3 -6 v-3"/>';
  if (has('tv', 'televiz', 'monitor')) return '<rect class="sym thin" x="-10" y="-7" width="20" height="13"/><line class="sym thin" x1="-5" y1="10" x2="5" y2="10"/>';
  if (has('modem', 'nas', 'server', 'rpi', 'raspberry', 'intercom', 'domofon', 'priedėl', 'box')) return '<rect class="sym thin" x="-10" y="-5" width="20" height="10"/><circle class="sym thin" cx="-5" cy="0" r="1.5"/><circle class="sym thin" cx="0" cy="0" r="1.5"/>';
  if (has('doorbell', 'skambut')) return '<path class="sym thin" d="M-8 5 a8 8 0 0 1 16 0 z M0 5 v4"/>';
  if (has('speaker', 'kolonė', 'vinyl', 'vinil')) return '<path class="sym thin" d="M-8 -4 h5 l6 -6 v20 l-6 -6 h-5 z"/>';
  return '';
}
