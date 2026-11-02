// Formatting helpers (Lithuanian number format).

const nf1 = new Intl.NumberFormat('lt-LT', { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('lt-LT', { maximumFractionDigits: 0 });

export function fmtPower(w) {
  if (w == null) return '? W';
  if (Math.abs(w) >= 1000) return `${nf1.format(w / 1000)} kW`;
  return `${nf0.format(w)} W`;
}

export function fmtCurrent(a) {
  return a == null ? '? A' : `${nf1.format(a)} A`;
}

export function fmtValue(v) {
  if (v == null) return '—';
  if (typeof v === 'boolean') return v ? 'taip' : 'ne';
  if (Array.isArray(v)) return v.map(fmtValue).join(', ');
  if (typeof v === 'object' && 'expression' in v) return `= ${v.expression}`;
  if (typeof v === 'object') return `${nf1.format(v.value)} ${v.unit}`;
  return String(v);
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// First phrase of the doc text, for compact labels.
export function shortName(inst) {
  const text = (inst.doc ?? inst.name).split(/[\n,;:(]/)[0].trim();
  return text.length > 18 ? `${text.slice(0, 17)}…` : text;
}

export function displayName(inst) {
  const label = inst.attrs?.label;
  const doc = inst.doc ? inst.doc.split('\n')[0] : null;
  if (label && doc) return `${label} · ${doc}`;
  return label ?? doc ?? inst.name;
}
