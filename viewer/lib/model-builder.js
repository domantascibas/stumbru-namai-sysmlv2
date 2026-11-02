// Turns parsed SysML files into a flat, JSON-friendly instance model:
// every part usage under a package becomes an instance with its fully
// resolved attributes (defaults and redefinitions along the type chain),
// its type chain, children and resolved references.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseSysml } from './sysml-parser.js';

export async function listSysmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.sysml'))
    .map((e) => path.join(e.parentPath ?? e.path, e.name))
    .sort();
}

function valueToJson(expr) {
  switch (expr.type) {
    case 'string':
    case 'boolean':
      return expr.value;
    case 'number':
      return expr.unit ? { value: expr.value, unit: expr.unit } : expr.value;
    case 'enum':
      return expr.value;
    case 'tuple':
      return expr.items.map(valueToJson);
    case 'expression':
      return { expression: expr.text };
    default:
      throw new Error(`cannot convert ${expr.type} to a value`);
  }
}

function referencePaths(expr) {
  if (expr.type === 'reference') return [expr.path];
  if (expr.type === 'tuple') return expr.items.flatMap(referencePaths);
  return null;
}

export function buildModel(files) {
  const defs = new Map();
  const enums = new Map();
  const roots = [];
  const packages = [];
  const warnings = [];

  const collect = (elements, packageName) => {
    for (const el of elements) {
      if (el.kind === 'package') {
        packages.push({ name: el.name, doc: docOf(el.elements) });
        collect(el.elements, el.name);
      } else if (el.kind === 'partDef') {
        defs.set(el.name, el);
      } else if (el.kind === 'enumDef') {
        enums.set(el.name, el.elements.filter((e) => e.kind === 'enumLiteral').map((e) => e.name));
      } else if (el.kind === 'usage' && el.featureKind === 'part') {
        roots.push({ usage: el, packageName });
      }
    }
  };
  for (const { ast } of files) collect(ast, null);

  // Type chain from the most general to the most specific type.
  const typeChain = (typeName, seen = new Set()) => {
    if (!typeName) return [];
    const simple = typeName.split('::').pop();
    const def = defs.get(simple);
    if (!def) {
      warnings.push(`unknown type '${typeName}'`);
      return [];
    }
    if (seen.has(simple)) return [];
    seen.add(simple);
    return [...def.supertypes.flatMap((s) => typeChain(s, seen)), def];
  };

  const instances = {};

  const applyFeatures = (inst, elements, isDefinition) => {
    for (const el of elements) {
      if (el.kind === 'doc' && !isDefinition) inst.doc = el.text;
      if (el.kind === 'comment' && !isDefinition) inst.comments.push(el.text);
      if (el.kind !== 'usage' || el.featureKind === 'part' && !el.redefines && !el.isRef) continue;
      if (el.value === undefined) {
        // Declaration without a value, e.g. `attribute power : PowerValue;`
        continue;
      }
      // `ref :>> x = a.b;` binds references; any other bare name is an expression
      // over the instance's own features, e.g. `:>> connectedLoad default = power;`.
      const refs = el.isRef ? referencePaths(el.value) : null;
      if (!el.isRef && el.value.type === 'reference') {
        inst.attrs[el.name] = { expression: el.value.path.join('.') };
        if (!isDefinition) inst.ownAttrs.push(el.name);
      } else if (refs) {
        inst.pendingRefs.push({ name: el.name, paths: refs, line: el.line, file: el.file });
      } else {
        inst.attrs[el.name] = valueToJson(el.value);
        if (!isDefinition) inst.ownAttrs.push(el.name);
      }
    }
  };

  const instantiate = (usage, parentId, packageName) => {
    const id = parentId ? `${parentId}.${usage.name}` : usage.name;
    const chain = typeChain(usage.type);
    const inst = {
      id,
      name: usage.name,
      package: packageName,
      type: usage.type?.split('::').pop() ?? null,
      types: chain.map((d) => d.name),
      count: usage.multiplicity ? usage.multiplicity.lower : 1,
      subsets: usage.subsets ?? null,
      doc: null,
      comments: [],
      attrs: {},
      ownAttrs: [], // attributes given a value on the instance itself (not inherited)
      refs: {},
      pendingRefs: [],
      parent: parentId,
      children: [],
      source: { file: usage.file, line: usage.line },
    };
    instances[id] = inst;
    for (const def of chain) applyFeatures(inst, def.elements, true);
    // A type's doc describes the type; the instance keeps it unless it has its own.
    const typeDoc = chain.length ? docOf(chain[chain.length - 1].elements) : null;
    applyFeatures(inst, usage.elements, false);
    if (!inst.doc && typeDoc) inst.typeDoc = typeDoc;
    for (const el of usage.elements) {
      if (el.kind === 'usage' && el.featureKind === 'part' && !el.redefines && !el.isRef) {
        inst.children.push(instantiate(el, id, packageName).id);
      }
    }
    return inst;
  };

  const rootIds = roots.map(({ usage, packageName }) => instantiate(usage, null, packageName).id);

  // Resolve references: the first path segment is looked up in the enclosing
  // scopes (own members, siblings, the parent's siblings, ...) and finally the roots.
  const childByName = (id, name) => instances[id]?.children.find((c) => instances[c].name === name);
  const resolve = (fromId, segments) => {
    let scope = fromId;
    let start = null;
    while (scope && !start) {
      start = childByName(scope, segments[0]);
      scope = instances[scope].parent;
    }
    if (!start) start = rootIds.find((r) => instances[r].name === segments[0]);
    if (!start) return null;
    let current = start;
    for (const seg of segments.slice(1)) {
      current = childByName(current, seg);
      if (!current) return null;
    }
    return current;
  };

  for (const inst of Object.values(instances)) {
    for (const ref of inst.pendingRefs) {
      inst.refs[ref.name] = ref.paths
        .map((segments) => {
          const target = resolve(inst.id, segments);
          if (!target) warnings.push(`${ref.file}:${ref.line}: cannot resolve '${segments.join('.')}' in ${inst.id}`);
          return target;
        })
        .filter(Boolean);
    }
    delete inst.pendingRefs;
  }

  return {
    builtAt: new Date().toISOString(),
    files: files.map((f) => f.name),
    packages,
    enums: Object.fromEntries(enums),
    roots: rootIds,
    instances,
    warnings,
  };
}

function docOf(elements) {
  return elements.find((e) => e.kind === 'doc')?.text ?? null;
}

export async function loadModel(dir) {
  const paths = await listSysmlFiles(dir);
  const files = [];
  for (const p of paths) {
    const name = path.relative(dir, p);
    files.push({ name, ast: parseSysml(await readFile(p, 'utf8'), name) });
  }
  return buildModel(files);
}
