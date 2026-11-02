// Distribution board as a single-line diagram with IEC 60617 symbols:
// the supply enters at the top, runs through the main breaker and the RCD
// onto the busbar, and every circuit breaker hangs off the busbar. Lines
// with power are drawn in their phase colour, lines without power grey and
// dashed. Clicking a breaker switches it.

import { is, num, PHASES } from './simulate.js';
import { fmtPower, fmtCurrent, escapeHtml } from './format.js';

const PHASE_COLOR = { L1: 'var(--l1)', L2: 'var(--l2)', L3: 'var(--l3)' };

// Breakers in the board, top-down: each device with the ones nested in it.
function tree(model) {
  const I = model.instances;
  const build = (id) => ({
    id,
    children: I[id].children.filter((c) => is(I[c], 'ProtectiveDevice')).map(build),
  });
  const boards = model.roots.filter((r) => is(I[r], 'DistributionBoard'));
  return boards.flatMap((b) => I[b].children.filter((c) => is(I[c], 'ProtectiveDevice')).map(build));
}

function rating(inst) {
  const a = inst.attrs;
  if (is(inst, 'Rcd')) return `${num(a.ratedCurrent) ?? '?'} A · ${Math.round((num(a.residualCurrent) ?? 0) * 1000)} mA ${a.rcdType ?? ''}`;
  return `${a.tripCurve ?? ''}${num(a.ratedCurrent) ?? '?'}`;
}

// Breaker symbol centred at (x, y): fixed contact with the breaker cross on
// top, the moving contact closed (vertical) or open (tilted), and slashes
// for the number of poles in single-line notation.
function breakerSymbol(inst, b, x, y, color, view) {
  const poles = num(inst.attrs.poles) ?? 1;
  const live = b.energized && b.closed;
  const top = y - 22;
  const bottom = y + 22;
  const contactTop = y - 10;
  const blade = b.closed ? `L${x} ${contactTop}` : `L${x - 13} ${contactTop + 3}`;
  const slashes = poles > 1
    ? Array.from({ length: poles }, (_, k) => `<line x1="${x - 5}" y1="${top - 14 + k * 5 + 3}" x2="${x + 5}" y2="${top - 14 + k * 5 - 3}"/>`).join('')
    : '';
  const rcd = is(inst, 'Rcd')
    ? `<ellipse cx="${x}" cy="${bottom + 12}" rx="9" ry="5"/><line class="link" x1="${x + 9}" y1="${bottom + 12}" x2="${x + 14}" y2="${y}"/><line class="link" x1="${x + 14}" y1="${y}" x2="${x + 4}" y2="${y + 1}"/>`
    : '';
  const cls = ['brk', b.closed ? 'closed' : 'open', b.energized ? '' : 'upstream-off', b.overloaded ? 'overloaded' : '',
    view.selected === inst.id ? 'selected' : '', view.flash?.[inst.id] ? `flash-${view.flash[inst.id]}` : '',
    view.focus && !view.focus.has(inst.id) ? 'dim' : ''].filter(Boolean).join(' ');
  return `<g class="${cls}" data-id="${inst.id}" style="--wire:${live ? color : 'var(--dead)'}">
    <rect class="hit" x="${x - 20}" y="${top - 16}" width="40" height="${bottom - top + 34}"/>
    <g class="sym">
      <line x1="${x}" y1="${top}" x2="${x}" y2="${contactTop}"/>
      <path d="M${x - 4} ${contactTop - 4} l8 8 m0 -8 l-8 8"/>
      <path class="blade" d="M${x} ${y + 8} ${blade}"/>
      <line x1="${x}" y1="${y + 8}" x2="${x}" y2="${bottom}"/>
      ${slashes}${rcd}
    </g>
  </g>`;
}

export function renderPanel(el, model, sim, view) {
  const I = model.instances;
  const roots = tree(model);
  const width = 540;
  const out = [];
  const feeders = [];
  let y = 26;

  // Supply, then each upstream device that has nested devices (main switch, RCD).
  const chain = [];
  let level = roots;
  while (level.length === 1 && level[0].children.length) {
    chain.push(level[0]);
    level = level[0].children;
  }
  const leaves = chain.length ? level : roots;
  const cx = 60;
  out.push(`<text class="supply" x="${cx + 14}" y="${y}">3N~ 400/230 V</text>`);
  out.push(`<line class="wire" style="--wire:var(--live)" x1="${cx}" y1="${y - 14}" x2="${cx}" y2="${y + 28}"/>`);
  y += 62;
  for (const node of chain) {
    const inst = I[node.id];
    const b = sim.breakers[node.id];
    out.push(breakerSymbol(inst, b, cx, y, 'var(--live)', view));
    out.push(`<text class="blabel" x="${cx + 26}" y="${y - 4}">${escapeHtml(inst.attrs.label ?? inst.name)}</text>`);
    out.push(`<text class="brating" x="${cx + 26}" y="${y + 12}">${escapeHtml(rating(inst))} · ${num(inst.attrs.poles) ?? 1}P</text>`);
    out.push(`<text class="bload" x="${cx + 26}" y="${y + 27}">${fmtCurrent(b.currentA)} / ${b.ratedA ?? '?'} A</text>`);
    const live = b.energized && b.closed;
    const extra = is(inst, 'Rcd') ? 20 : 0;
    out.push(`<line class="wire${live ? '' : ' dead'}" style="--wire:${live ? 'var(--live)' : 'var(--dead)'}" x1="${cx}" y1="${y + 22 + extra}" x2="${cx}" y2="${y + 50}"/>`);
    y += 72;
  }

  // Busbar with the final circuits.
  const busY = y - 22;
  const n = leaves.length;
  const x0 = cx;
  const step = Math.min(40, (width - x0 - 20) / Math.max(n - 1, 1));
  const busLive = chain.length ? sim.breakers[chain[chain.length - 1].id].energized && sim.breakers[chain[chain.length - 1].id].closed : true;
  out.push(`<line class="bus${busLive ? '' : ' dead'}" x1="${x0}" y1="${busY}" x2="${x0 + step * (n - 1)}" y2="${busY}"/>`);
  leaves.forEach((node, i) => {
    const inst = I[node.id];
    const b = sim.breakers[node.id];
    const x = x0 + step * i;
    const poles = num(inst.attrs.poles) ?? 1;
    const color = poles >= 3 ? 'var(--three-phase)' : PHASE_COLOR[inst.attrs.phase ?? 'L1'];
    const by = busY + 44;
    const live = b.energized && b.closed;
    out.push(`<line class="wire${b.energized ? '' : ' dead'}" style="--wire:${b.energized ? color : 'var(--dead)'}" x1="${x}" y1="${busY}" x2="${x}" y2="${by - 22}"/>`);
    out.push(breakerSymbol(inst, b, x, by, color, view));
    out.push(`<line class="wire${live ? '' : ' dead'}" style="--wire:${live ? color : 'var(--dead)'}" x1="${x}" y1="${by + 22}" x2="${x}" y2="${by + 40}"/>`);
    const pct = Math.min(b.ratio, 1);
    feeders.push(`<g class="feeder${b.overloaded ? ' overloaded' : b.ratio > 0.8 ? ' warn' : ''}" data-id="${inst.id}">
      <text class="blabel mid" x="${x}" y="${by + 56}">${escapeHtml(inst.attrs.label ?? inst.name)}</text>
      <text class="brating mid" x="${x}" y="${by + 70}">${escapeHtml(rating(inst))}</text>
      ${poles >= 3 ? `<text class="ph-tag mid" x="${x}" y="${by + 84}">3P</text>` : `<rect class="ph-chip" x="${x - 9}" y="${by + 75}" width="18" height="12" rx="3" style="fill:${color}"/><text class="ph-tag mid dark" x="${x}" y="${by + 84}">${escapeHtml(inst.attrs.phase ?? 'L1')}</text>`}
      <rect class="meter" x="${x - 4}" y="${by + 92}" width="8" height="46" rx="2"/>
      <rect class="meter-fill" x="${x - 4}" y="${by + 92 + 46 * (1 - pct)}" width="8" height="${46 * pct}" rx="2"/>
      <text class="bload mid" x="${x}" y="${by + 152}">${b.loadW ? fmtCurrent(b.currentA).replace(' A', '') : '0'}</text>
      <text class="cname" transform="translate(${x + 4} ${by + 162}) rotate(90)">${escapeHtml(inst.attrs.name ?? '')}</text>
    </g>`);
  });
  const height = busY + 44 + 162 + 190;
  el.innerHTML = `<svg viewBox="0 0 ${width} ${height}" class="sld">${out.join('')}${feeders.join('')}</svg>`;
}

export function renderPhases(el, sim) {
  const rated = sim.mainRatedA;
  el.innerHTML = PHASES.map((ph) => {
    const w = sim.phases[ph];
    const a = w / 230;
    const ratio = rated ? a / rated : 0;
    return `<div class="phase-row ${ratio > 1 ? 'overloaded' : ratio > 0.8 ? 'warn' : ''}">
      <span class="ph ${ph}">${ph}</span>
      <div class="bar"><i style="width:${Math.min(ratio * 100, 100)}%"></i></div>
      <span class="phase-val">${fmtCurrent(a)}${rated ? ` / ${rated} A` : ''}<small>${fmtPower(w)}</small></span>
    </div>`;
  }).join('');
}
