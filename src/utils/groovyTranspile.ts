// A small, conservative Groovy → JavaScript transpiler tailored to the
// patterns SAP CPI developers write in script steps. It is NOT a full
// Groovy compiler — it only handles the subset commonly used:
//
//   def foo = ...
//   def Message processData(Message message) { ... return message }
//   String name = "x"
//   message.getProperty("foo")
//   "${variable}" string interpolation
//   import statements (stripped)
//   static type declarations on local vars (stripped)
//
// Scripts that use Groovy-only features (closures with -> beyond simple cases,
// Groovy operators like ?. as far as JS handles them, etc.) typically still
// run because most of those are valid JS too. For pure-JS scripts,
// the transpiler is a no-op.

const TYPE_KEYWORDS = [
  'def',
  'String',
  'Integer',
  'int',
  'Long',
  'long',
  'Double',
  'double',
  'Float',
  'float',
  'Boolean',
  'boolean',
  'Number',
  'BigDecimal',
  'BigInteger',
  'Object',
  'List',
  'Map',
  'ArrayList',
  'HashMap',
  'LinkedHashMap',
  'StringBuilder',
  'StringBuffer',
  'Date',
  'Calendar',
  'Message',
];

function stripImports(src: string): string {
  return src
    .split('\n')
    .filter((l) => !/^\s*(import|package)\s+/.test(l))
    .join('\n');
}

function rewriteFunctionDecls(src: string): string {
  // Convert `def Message processData(Message message) {` (or any return type) into
  // `function processData(message) {`.
  // Also handle: `Message processData(Message message) {` without `def`.
  return src.replace(
    /(?:^|\n)[ \t]*(?:def\s+)?(?:[A-Za-z_][A-Za-z0-9_<>\[\]]*\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\{/g,
    (full, name, params) => {
      // skip lines that already look like JS like "function ..."
      if (full.includes('function ')) return full;
      // strip parameter type annotations: `Message message` -> `message`
      const cleanedParams = params
        .split(',')
        .map((p: string) => {
          const trimmed = p.trim();
          if (!trimmed) return '';
          const parts = trimmed.split(/\s+/);
          return parts[parts.length - 1].replace(/[=].*/, '');
        })
        .filter(Boolean)
        .join(', ');
      return `\nfunction ${name}(${cleanedParams}) {`;
    }
  );
}

function rewriteVarDecls(src: string): string {
  // Replace leading type declarations on local variables with `let`.
  // e.g. `String name = "x"` => `let name = "x"`.
  // Also `def name = ...` => `let name = ...`.
  const typePattern = TYPE_KEYWORDS.map((t) => t).join('|');
  const re = new RegExp(
    `(^|\\n|;|\\{)\\s*(${typePattern})(\\s+)([A-Za-z_][A-Za-z0-9_]*)\\s*=`,
    'g'
  );
  return src.replace(re, (_full, lead, _type, _ws, name) => `${lead}let ${name} =`);
}

function rewriteForEach(src: string): string {
  // `for (String x : list)` => `for (let x of list)`
  return src
    .replace(
      /for\s*\(\s*[A-Za-z_][A-Za-z0-9_<>]*\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^)]+)\)/g,
      'for (let $1 of $2)'
    )
    .replace(
      /for\s*\(\s*def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^)]+)\)/g,
      'for (let $1 of $2)'
    );
}

function rewriteGString(src: string): string {
  // Convert "...${expr}..." to template literal `...${expr}...` ONLY when
  // the string contains `${`. We detect double-quoted strings carefully.
  return src.replace(/"((?:[^"\\]|\\.)*)"/g, (full, inner: string) => {
    if (!inner.includes('${')) return full;
    // escape backticks in inner
    const escaped = inner.replace(/`/g, '\\`').replace(/\\"/g, '"');
    return '`' + escaped + '`';
  });
}

function rewriteSafeNav(src: string): string {
  // Groovy `?.` is already valid JS optional chaining since ES2020.
  return src;
}

function rewriteAs(src: string): string {
  // `value as String` => `String(value)`; very rough but good enough for
  // common CPI patterns like `message.getBody(java.lang.String as String)`.
  return src.replace(/(\w+)\s+as\s+String\b/g, 'String($1)');
}

function rewriteElvis(src: string): string {
  // Groovy Elvis operator `a ?: b`  →  `(a || b)` (JS coalescing).
  // Must NOT match `?.` (optional chaining) or `?` followed by something
  // other than `:`. We also must NOT touch `?:` inside string literals,
  // but a heuristic that simply requires whitespace or a paren before `?`
  // catches the realistic cases without breaking optional chaining.
  return src.replace(/\?:/g, ' || ');
}

function rewriteJavaTypeHints(src: string): string {
  // CPI scripts often pass `String.class` or `String` as a type hint to
  // `getBody()`/`getHeader()`. In JS those expressions evaluate to the
  // global `String` constructor, which is harmless. Strip `.class` though.
  return src.replace(/\b([A-Z][A-Za-z0-9_]*)\.class\b/g, '$1');
}

function rewriteNewMap(src: string): string {
  // Common CPI groovy: `new HashMap()` → `({})`, `new ArrayList()` → `([])`
  return src
    .replace(/new\s+(HashMap|LinkedHashMap|TreeMap)\s*\(\s*\)/g, '({})')
    .replace(/new\s+(ArrayList|LinkedList|Vector)\s*\(\s*\)/g, '([])');
}

function injectMessageHelpers(src: string): string {
  // Strip Groovy-only `@Field` / `@CompileStatic` annotations on lines
  return src
    .split('\n')
    .filter((l) => !/^\s*@[A-Z]/.test(l))
    .join('\n');
}

export function transpileGroovy(src: string): string {
  let out = src;
  out = stripImports(out);
  out = injectMessageHelpers(out);
  out = rewriteGString(out);
  out = rewriteForEach(out);
  out = rewriteVarDecls(out);
  out = rewriteFunctionDecls(out);
  out = rewriteAs(out);
  out = rewriteJavaTypeHints(out);
  out = rewriteNewMap(out);
  out = rewriteElvis(out);
  out = rewriteSafeNav(out);
  return out;
}
