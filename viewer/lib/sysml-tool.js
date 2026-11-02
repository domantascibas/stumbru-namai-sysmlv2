// Runs the OpenSysML command line tool (`sysml`) on the model: validation
// diagnostics and the load roll-up the model's own expressions define
// (connected load of every device and breaker, per phase).
//
// The binary is taken from $SYSML_BIN, else `sysml` on the PATH. Without it
// the viewer still works and falls back to its own calculation.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const BIN = process.env.SYSML_BIN || 'sysml';
const MAX_BUFFER = 32 * 1024 * 1024;

const ROLLUP_FEATURES = {
  ProtectiveDevice: ['connectedLoad', 'connectedLoadL1', 'connectedLoadL2', 'connectedLoadL3'],
  ElectricalDevice: ['connectedLoad'],
};

let versionCache;
export async function toolVersion() {
  if (versionCache !== undefined) return versionCache;
  try {
    const { stdout } = await run(BIN, ['-version']);
    versionCache = stdout.split('\n')[0].trim();
  } catch {
    versionCache = null;
  }
  return versionCache;
}

// "6050.0 [W]", "220/23 [SI::A]", "true", "<undetermined>"
export function parseValue(text) {
  const t = text.trim();
  if (t === 'true' || t === 'false') return t === 'true';
  if (t === '<undetermined>') return null;
  const m = t.match(/^(-?[\d.eE+-]+)(?:\/([\d.eE+-]+))?(?:\s*\[(?:\w+::)?([^\]]+)\])?$/);
  if (!m) return t;
  const value = Number(m[1]) / (m[2] ? Number(m[2]) : 1);
  return m[3] ? { value, unit: m[3] } : value;
}

export async function validate(modelDir) {
  const cwd = path.dirname(modelDir);
  try {
    const { stdout } = await run(BIN, ['-validate', '-json', path.basename(modelDir)], { cwd, maxBuffer: MAX_BUFFER });
    return JSON.parse(stdout);
  } catch (err) {
    // A model with errors exits nonzero but still prints the report.
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        /* fall through */
      }
    }
    throw new Error(`sysml -validate failed: ${err.stderr || err.message}`);
  }
}

export async function rollup(modelDir, model) {
  const queries = [];
  for (const inst of Object.values(model.instances)) {
    if (!inst.package) continue;
    for (const [type, features] of Object.entries(ROLLUP_FEATURES)) {
      if (!inst.types.includes(type)) continue;
      for (const f of features) queries.push({ id: inst.id, feature: f, expr: `${inst.package}::${inst.id}.${f}` });
    }
  }
  if (!queries.length) return {};
  const args = ['-quiet', ...queries.flatMap((q) => ['-e', q.expr]), path.basename(modelDir)];
  let stdout;
  try {
    ({ stdout } = await run(BIN, args, { cwd: path.dirname(modelDir), maxBuffer: MAX_BUFFER }));
  } catch (err) {
    throw new Error(`sysml roll-up failed: ${(err.stderr || err.stdout || err.message).trim().split('\n').pop()}`);
  }
  // Output: "✓ <expression>" followed by "  = <value>".
  const values = new Map();
  const lines = stdout.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^✓ (.+)$/);
    const v = lines[i + 1]?.match(/^\s+= (.*)$/);
    if (m && v) values.set(m[1].trim(), parseValue(v[1]));
  }
  const result = {};
  for (const q of queries) {
    if (!values.has(q.expr)) continue;
    (result[q.id] ??= {})[q.feature] = values.get(q.expr);
  }
  return result;
}

export async function runTool(modelDir, model) {
  const version = await toolVersion();
  if (!version) return { available: false };
  const [validation, values] = await Promise.allSettled([validate(modelDir), rollup(modelDir, model)]);
  return {
    available: true,
    version,
    validation: validation.status === 'fulfilled' ? validation.value : { status: 'error', error: validation.reason.message },
    rollup: values.status === 'fulfilled' ? values.value : null,
    rollupError: values.status === 'rejected' ? values.reason.message : null,
  };
}
