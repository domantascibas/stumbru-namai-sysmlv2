// Simulator: the model describes the installation (what is connected to
// what); the state of breakers, switches and appliances is chosen in the
// viewer. From both, this derives which devices have power ("available"),
// which are running, and the load on every breaker and phase.

export const VOLTAGE = 230;
export const PHASES = ['L1', 'L2', 'L3'];

export const is = (inst, type) => Boolean(inst?.types?.includes(type));
export const num = (v) => (v == null ? null : typeof v === 'object' ? v.value ?? null : v);

export function roomOf(model, id) {
  let cur = model.instances[id];
  while (cur && !is(cur, 'Room')) cur = model.instances[cur.parent];
  return cur ?? null;
}

// Number of independently switched gangs of a switch.
export const gangCount = (sw) => (sw.attrs.switchType === 'doubleGang' ? Math.max(2, sw.refs.controls?.length ?? 2) : 1);

// The simulator's state: only deviations from the defaults are stored.
//   breakers: { id: false }       breakers are on unless switched off
//   switches: { id: [bool, ...] } one value per gang, off by default
//   devices:  { id: bool }        appliances and lights without a switch are
//                                 off by default; power strips are on
export function emptyState() {
  return { breakers: {}, switches: {}, devices: {} };
}

export function simulate(model, state = emptyState(), rollup = null) {
  const I = model.instances;
  const all = Object.values(I);

  const breakerOf = {};
  for (const b of all) if (is(b, 'ProtectiveDevice')) for (const d of b.refs.feeds ?? []) breakerOf[d] = b.id;

  const hostOf = {};
  for (const h of all) for (const a of h.refs.pluggedIn ?? []) hostOf[a] = h.id;

  // Which switch (and which of its gangs) controls each device.
  const switchesOf = {};
  const controlledBy = {};
  for (const s of all) {
    if (!is(s, 'Switch') && !is(s, 'Thermostat')) continue;
    (s.refs.controls ?? []).forEach((d, idx) => {
      (controlledBy[d] ??= []).push(s.id);
      if (is(s, 'Switch')) (switchesOf[d] ??= []).push({ sw: s, gang: gangCount(s) > 1 ? idx : 0 });
    });
  }

  const protectiveChain = (id) => {
    const chain = [];
    for (let cur = I[id]; cur; cur = I[cur.parent]) if (is(cur, 'ProtectiveDevice')) chain.push(cur.id);
    return chain;
  };
  const isClosed = (id) => state.breakers[id] !== false;
  const closedUpstream = (breakerId) => protectiveChain(breakerId).every(isClosed);

  // How a device gets power: its breaker, and the hosts (outlet, power strip,
  // parent appliance) on the way.
  const supplyCache = {};
  const supply = (id, seen = new Set()) => {
    if (id in supplyCache) return supplyCache[id];
    if (seen.has(id)) return null;
    seen.add(id);
    let result = null;
    if (breakerOf[id]) {
      result = { breaker: breakerOf[id], via: [] };
    } else {
      const host = hostOf[id] ?? (is(I[I[id]?.parent], 'Load') ? I[id].parent : null);
      const upstream = host ? supply(host, seen) : null;
      if (upstream) result = { breaker: upstream.breaker, via: [host, ...upstream.via] };
    }
    supplyCache[id] = result;
    return result;
  };

  const stripOn = (id) => state.devices[id] !== false;
  const energized = (id) => {
    const s = supply(id);
    if (!s || !closedUpstream(s.breaker)) return false;
    return s.via.every((v) => !is(I[v], 'PowerStrip') || stripOn(v));
  };

  const gangOn = (sw, gang) => Boolean(state.switches[sw.id]?.[gang]);

  // Two-way and intermediate switches toggle the light together (XOR);
  // other switches turn it on (OR). A device without a switch has its own state.
  const commanded = (inst) => {
    const sws = switchesOf[inst.id];
    if (!sws?.length) return state.devices[inst.id] === true;
    const multiway = sws.filter(({ sw }) => ['twoWay', 'intermediate'].includes(sw.attrs.switchType));
    const others = sws.filter((s) => !multiway.includes(s));
    const viaMultiway = multiway.reduce((acc, { sw, gang }) => acc !== gangOn(sw, gang), false);
    return (multiway.length > 0 && viaMultiway) || others.some(({ sw, gang }) => gangOn(sw, gang));
  };

  const bulbsOf = (inst) => inst.children.map((c) => I[c]).filter((c) => is(c, 'Bulb'));

  // Rated power when running.
  const ratedPower = (inst) => {
    if (is(inst, 'PowerStrip')) return 0;
    const bulbs = bulbsOf(inst);
    if (is(inst, 'Light') && bulbs.length) return bulbs.reduce((sum, b) => sum + b.count * (num(b.attrs.power) ?? 0), 0);
    return num(inst.attrs.power) ?? 0;
  };

  const devices = {};
  for (const inst of all) {
    if (!is(inst, 'ElectricalDevice')) continue;
    const s = supply(inst.id);
    const live = energized(inst.id);
    let on = false;
    if (is(inst, 'Light') || is(inst, 'CableEnd')) on = commanded(inst);
    else if (is(inst, 'PowerStrip')) on = stripOn(inst.id);
    else if (is(inst, 'Load')) on = state.devices[inst.id] === true;
    else if (is(inst, 'Switch')) on = Array.from({ length: gangCount(inst) }, (_, k) => gangOn(inst, k)).some(Boolean);
    const isLoad = is(inst, 'Load') && !is(inst, 'PowerStrip');
    const rated = isLoad ? ratedPower(inst) : null;
    devices[inst.id] = {
      id: inst.id,
      breaker: s?.breaker ?? null,
      via: s?.via ?? [],
      host: hostOf[inst.id] ?? null,
      fed: Boolean(s), // connected to the panel at all
      live, // has power right now ("available")
      on, // switched on (by its switch or by itself)
      active: is(inst, 'Switch') ? on : live && on,
      ratedPower: rated,
      power: live && on && isLoad ? rated : 0,
      // Power inherited from the library default (0 W) means it is not known yet.
      powerUnknown: isLoad && !inst.ownAttrs.includes('power') && !bulbsOf(inst).length,
      hasSwitch: Boolean(switchesOf[inst.id]?.length),
      controlledBy: controlledBy[inst.id] ?? [],
    };
  }

  // Switches and thermostats sit on the circuit of the device they control.
  for (const d of Object.values(devices)) {
    const inst = I[d.id];
    if (!is(inst, 'Switch') && !is(inst, 'Thermostat')) continue;
    const target = devices[inst.refs.controls?.[0]];
    if (!target) continue;
    Object.assign(d, { breaker: target.breaker, fed: target.fed, live: target.live });
  }

  // Loads per breaker, split per phase. A multi-pole breaker's load is
  // spread evenly over the phases (actual split unknown).
  const protective = all.filter((i) => is(i, 'ProtectiveDevice'));
  const breakers = {};
  for (const p of protective) {
    breakers[p.id] = {
      id: p.id,
      closed: isClosed(p.id),
      energized: closedUpstream(p.id),
      loadW: 0,
      connectedW: 0,
      phases: { L1: 0, L2: 0, L3: 0 },
      devices: [],
    };
  }
  for (const d of Object.values(devices)) {
    if (!d.breaker) continue;
    const b = I[d.breaker];
    const poles = num(b.attrs.poles) ?? 1;
    const chain = protectiveChain(d.breaker);
    for (const id of chain) {
      breakers[id].devices.push(d.id);
      if (d.ratedPower) breakers[id].connectedW += d.ratedPower;
    }
    if (!d.power) continue;
    const split = poles >= 3 ? PHASES.map((ph) => [ph, d.power / 3]) : [[b.attrs.phase ?? 'L1', d.power]];
    for (const id of chain) {
      breakers[id].loadW += d.power;
      for (const [ph, w] of split) breakers[id].phases[ph] += w;
    }
  }
  for (const p of protective) {
    const entry = breakers[p.id];
    const poles = num(p.attrs.poles) ?? 1;
    entry.currentA = poles >= 3 ? Math.max(...PHASES.map((ph) => entry.phases[ph])) / VOLTAGE : entry.loadW / VOLTAGE;
    entry.ratedA = num(p.attrs.ratedCurrent);
    entry.ratio = entry.ratedA ? entry.currentA / entry.ratedA : 0;
    entry.overloaded = entry.ratio > 1;
    // Connected (installed) load: from the model's own roll-up when the tool evaluated it.
    const connected = num(rollup?.[p.id]?.connectedLoad);
    if (connected != null) {
      entry.connectedW = connected;
      entry.connectedFromTool = true;
    }
  }

  const mains = protective.filter((p) => !protective.some((q) => q.id === p.parent));
  const phases = { L1: 0, L2: 0, L3: 0 };
  for (const m of mains) for (const ph of PHASES) phases[ph] += breakers[m.id].phases[ph];

  return {
    devices,
    breakers,
    phases,
    totalW: PHASES.reduce((s, ph) => s + phases[ph], 0),
    mainRatedA: mains.length ? Math.min(...mains.map((m) => breakers[m.id].ratedA ?? Infinity)) : null,
    mains: mains.map((m) => m.id),
    unknownActive: Object.values(devices).filter((d) => d.active && d.powerUnknown).map((d) => d.id),
    protectiveChain,
    bulbsOf,
    switchesOf,
    phaseOf: (breakerId) => {
      const b = I[breakerId];
      return (num(b?.attrs.poles) ?? 1) >= 3 ? null : b?.attrs.phase ?? 'L1';
    },
  };
}
