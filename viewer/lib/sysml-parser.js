// Parser for the subset of SysML v2 textual notation used in model/.
//
// Supported: packages, imports (ignored), doc/comment texts, enum defs,
// (abstract) part defs with specialization, part usages with type,
// multiplicity and subsetting, attribute declarations with defaults,
// redefinitions (`:>> name = value;`, `ref :>> name = value;`,
// `attribute :>> name default = value;`) and value expressions
// (strings, numbers with units, booleans, enum literals, qualified
// references and tuples). Any other value expression (calculations such as
// `if poles >= 3 ? feedLoad / 3 else 0 [W]`) is kept as source text for the tool to evaluate.

export class SysmlSyntaxError extends Error {
  constructor(message, file, line, col) {
    super(`${file}:${line}:${col}: ${message}`);
    this.file = file;
    this.line = line;
    this.col = col;
  }
}

const SKIPPED = new Set([
  'item', 'port', 'interface', 'connect', 'connection', 'bind', 'flow', 'end', 'in', 'out', 'inout',
  'constraint', 'assert', 'require', 'requirement', 'subject', 'satisfy',
]);

const PUNCTUATION = [':>>', ':>', '::', '..', '{', '}', '(', ')', '[', ']', ';', ',', '=', ':', '.', '*'];

function cleanCommentText(raw) {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
    .join('\n')
    .trim();
}

export function tokenize(src, file = '<input>') {
  const tokens = [];
  let i = 0;
  let line = 1;
  let col = 1;

  const advance = (n) => {
    for (let k = 0; k < n; k++) {
      if (src[i] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      i++;
    }
  };

  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      advance(1);
      continue;
    }
    if (src.startsWith('//', i)) {
      while (i < src.length && src[i] !== '\n') advance(1);
      continue;
    }
    if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) throw new SysmlSyntaxError('unterminated comment', file, line, col);
      const text = cleanCommentText(src.slice(i + 2, end));
      // A block comment is the body of the preceding `doc` / `comment` keyword;
      // any other block comment is a plain note and is dropped.
      const prev = tokens[tokens.length - 1];
      if (prev && prev.type === 'id' && (prev.value === 'doc' || prev.value === 'comment') && prev.text === undefined) {
        prev.text = text;
      }
      advance(end + 2 - i);
      continue;
    }
    const start = { line, col };
    if (c === '"') {
      let j = i + 1;
      let value = '';
      while (j < src.length && src[j] !== '"') {
        if (src[j] === '\\' && j + 1 < src.length) {
          value += src[j + 1];
          j += 2;
        } else {
          value += src[j++];
        }
      }
      if (j >= src.length) throw new SysmlSyntaxError('unterminated string', file, line, col);
      tokens.push({ type: 'str', value, ...start });
      advance(j + 1 - i);
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (/[0-9]/.test(src[j])) j++;
      if (src[j] === '.' && /[0-9]/.test(src[j + 1] ?? '')) {
        j++;
        while (/[0-9]/.test(src[j])) j++;
      }
      tokens.push({ type: 'num', value: Number(src.slice(i, j)), ...start });
      advance(j - i);
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      tokens.push({ type: 'id', value: src.slice(i, j), ...start });
      advance(j - i);
      continue;
    }
    if (c === "'") {
      // Unrestricted name: 'any text'
      const end = src.indexOf("'", i + 1);
      if (end < 0) throw new SysmlSyntaxError('unterminated name', file, line, col);
      tokens.push({ type: 'id', value: src.slice(i + 1, end), ...start });
      advance(end + 1 - i);
      continue;
    }
    // Operators of calculation expressions are single-character tokens.
    const punct = PUNCTUATION.find((p) => src.startsWith(p, i)) ?? c;
    tokens.push({ type: 'punct', value: punct, ...start });
    advance(punct.length);
  }
  tokens.push({ type: 'eof', value: '', line, col });
  return tokens;
}

class Parser {
  constructor(tokens, file) {
    this.tokens = tokens;
    this.file = file;
    this.pos = 0;
  }

  peek(offset = 0) {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  next() {
    return this.tokens[this.pos++];
  }

  is(value, offset = 0) {
    const t = this.peek(offset);
    return (t.type === 'id' || t.type === 'punct') && t.value === value;
  }

  accept(value) {
    if (this.is(value)) return this.next();
    return null;
  }

  error(message, token = this.peek()) {
    return new SysmlSyntaxError(message, this.file, token.line, token.col);
  }

  expect(value) {
    const t = this.accept(value);
    if (!t) throw this.error(`expected '${value}', found '${this.peek().value || this.peek().type}'`);
    return t;
  }

  expectName() {
    const t = this.peek();
    if (t.type !== 'id') throw this.error(`expected a name, found '${t.value || t.type}'`);
    return this.next().value;
  }

  qualifiedName() {
    const parts = [this.expectName()];
    while (this.is('::') || this.is('.')) {
      this.next();
      parts.push(this.expectName());
    }
    return parts.join('::');
  }

  parseFile() {
    const elements = [];
    while (this.peek().type !== 'eof') elements.push(this.element());
    return elements;
  }

  body() {
    // `;` (no body) or `{ elements }`
    if (this.accept(';')) return [];
    this.expect('{');
    const elements = [];
    while (!this.is('}')) {
      if (this.peek().type === 'eof') throw this.error("unexpected end of file, missing '}'");
      elements.push(this.element());
    }
    this.expect('}');
    return elements;
  }

  element() {
    const start = this.peek();
    const loc = { file: this.file, line: start.line };
    while (this.is('private') || this.is('public') || this.is('protected')) this.next();

    if (this.accept('import')) {
      while (!this.accept(';')) {
        if (this.peek().type === 'eof') throw this.error("expected ';' after import");
        this.next();
      }
      return { kind: 'import', ...loc };
    }
    if (this.is('doc') || this.is('comment')) {
      const t = this.next();
      return { kind: t.value, text: t.text ?? '', ...loc };
    }
    if (this.accept('package')) {
      const name = this.expectName();
      return { kind: 'package', name, elements: this.body(), ...loc };
    }

    const isAbstract = Boolean(this.accept('abstract'));

    if (this.is('enum') && this.is('def', 1)) {
      this.next();
      this.next();
      const name = this.expectName();
      return { kind: 'enumDef', name, elements: this.body(), ...loc };
    }
    if (this.accept('enum')) {
      const name = this.expectName();
      this.expect(';');
      return { kind: 'enumLiteral', name, ...loc };
    }
    if (this.is('part') && this.is('def', 1)) {
      this.next();
      this.next();
      const name = this.expectName();
      const supertypes = [];
      if (this.accept(':>') || this.accept('specializes')) {
        supertypes.push(this.qualifiedName());
        while (this.accept(',')) supertypes.push(this.qualifiedName());
      }
      return { kind: 'partDef', name, isAbstract, supertypes, elements: this.body(), ...loc };
    }

    // Ports, interfaces, items, bindings, flows, constraints and requirements describe
    // the wiring and checks; the viewer does not draw them, so they are skipped whole.
    if (SKIPPED.has(this.peek().value) || (this.is('ref') && (this.is('port', 1) || this.is('bind', 1)))) {
      const keyword = this.peek().value;
      this.skipElement();
      return { kind: 'skipped', keyword, ...loc };
    }

    const isRef = Boolean(this.accept('ref'));
    if (this.accept('part')) return this.usage('part', isRef, loc);
    if (this.accept('attribute')) return this.usage('attribute', isRef, loc);
    if (this.is(':>>') || this.is('redefines')) return this.usage(isRef ? 'part' : 'feature', isRef, loc);

    throw this.error(`unexpected '${this.peek().value || this.peek().type}'`);
  }

  // Consumes one element: up to its ';', or through its balanced `{ ... }` body.
  skipElement() {
    let depth = 0;
    for (;;) {
      const t = this.next();
      if (t.type === 'eof') throw this.error("unexpected end of file, missing ';' or '}'", t);
      if (t.type !== 'punct') continue;
      if (t.value === '{') depth++;
      if (t.value === '}' && --depth === 0) return;
      if (t.value === ';' && depth === 0) return;
    }
  }

  usage(featureKind, isRef, loc) {
    const node = { kind: 'usage', featureKind, isRef, ...loc };
    if (this.accept(':>>') || this.accept('redefines')) {
      node.redefines = this.expectName();
      node.name = node.redefines;
    } else {
      node.name = this.expectName();
    }
    if (this.accept(':')) node.type = this.qualifiedName();
    if (this.is('[')) node.multiplicity = this.multiplicity();
    if (this.accept(':>') || this.accept('subsets')) node.subsets = this.qualifiedName();
    if (this.accept('default')) {
      node.isDefault = true;
      this.accept('=');
      node.value = this.valueOrExpression();
    } else if (this.accept('=')) {
      node.value = this.valueOrExpression();
    }
    node.elements = this.body();
    return node;
  }

  multiplicity() {
    this.expect('[');
    const bound = () => {
      if (this.accept('*')) return Infinity;
      const t = this.next();
      if (t.type !== 'num') throw this.error('expected a multiplicity bound', t);
      return t.value;
    };
    const lower = bound();
    let upper = lower;
    if (this.accept('..')) upper = bound();
    this.expect(']');
    return { lower, upper };
  }

  // A plain value, or the source text of a calculation up to the closing ';'.
  valueOrExpression() {
    const start = this.pos;
    try {
      const value = this.expression();
      if (this.is(';') || this.is('{')) return value;
    } catch (err) {
      if (!(err instanceof SysmlSyntaxError)) throw err;
    }
    this.pos = start;
    const parts = [];
    let depth = 0;
    const elementStart = [':>>', 'part', 'attribute', 'ref', 'doc', 'comment', '}'];
    while (depth > 0 || !this.is(';')) {
      if (depth === 0 && elementStart.some((k) => this.is(k))) throw this.error("expected ';'");
      const t = this.next();
      if (t.type === 'eof') throw this.error("expected ';' after expression", t);
      if (t.value === '(' || t.value === '[') depth++;
      if (t.value === ')' || t.value === ']') depth--;
      parts.push(t.type === 'str' ? JSON.stringify(t.value) : String(t.value));
    }
    return { type: 'expression', text: parts.join(' ') };
  }

  expression() {
    const t = this.peek();
    if (this.accept('(')) {
      const items = [];
      if (!this.is(')')) {
        items.push(this.expression());
        while (this.accept(',')) items.push(this.expression());
      }
      this.expect(')');
      return { type: 'tuple', items };
    }
    if (t.type === 'str') {
      this.next();
      return { type: 'string', value: t.value };
    }
    if (t.type === 'num') {
      this.next();
      const value = { type: 'number', value: t.value };
      if (this.is('[')) {
        this.next();
        value.unit = this.qualifiedName().split('::').pop(); // [SI::W] -> W
        this.expect(']');
      }
      return value;
    }
    if (t.type === 'id' && (t.value === 'true' || t.value === 'false')) {
      this.next();
      return { type: 'boolean', value: t.value === 'true' };
    }
    if (t.type === 'id') {
      const segments = [this.expectName()];
      let separator = null;
      while (this.is('::') || this.is('.')) {
        separator = this.next().value;
        segments.push(this.expectName());
      }
      if (separator === '::') {
        return { type: 'enum', enumType: segments.slice(0, -1).join('::'), value: segments[segments.length - 1] };
      }
      return { type: 'reference', path: segments };
    }
    throw this.error(`expected a value, found '${t.value || t.type}'`);
  }
}

export function parseSysml(src, file = '<input>') {
  return new Parser(tokenize(src, file), file).parseFile();
}
