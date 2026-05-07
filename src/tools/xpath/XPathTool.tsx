import { useMemo, useState } from 'react';
import { Crosshair, ListOrdered } from 'lucide-react';
import * as xpath from 'xpath';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';

interface NSPair {
  prefix: string;
  uri: string;
}

interface ResultRow {
  index: number;
  type: string;
  value: string;
  nodePath?: string;
}

function nodePath(node: any): string {
  // Build a /a/b[2]/c style path
  const parts: string[] = [];
  let cur = node;
  while (cur && cur.nodeType && cur.nodeType !== 9 /* document */) {
    let name: string = cur.localName || cur.nodeName;
    if (cur.nodeType === 2 /* attribute */) {
      parts.unshift(`@${name}`);
      cur = cur.ownerElement;
      continue;
    }
    if (cur.nodeType === 1 /* element */) {
      // index among same-named siblings
      let idx = 1;
      let prev = cur.previousSibling;
      while (prev) {
        if (prev.nodeType === 1 && (prev.localName || prev.nodeName) === name)
          idx++;
        prev = prev.previousSibling;
      }
      // count followers to know if we need an index at all
      let hasMultiple = idx > 1;
      let next = cur.nextSibling;
      while (next && !hasMultiple) {
        if (next.nodeType === 1 && (next.localName || next.nodeName) === name)
          hasMultiple = true;
        next = next.nextSibling;
      }
      parts.unshift(hasMultiple ? `${name}[${idx}]` : name);
    } else if (cur.nodeType === 3) {
      parts.unshift('text()');
    }
    cur = cur.parentNode;
  }
  return '/' + parts.join('/');
}

function nodeToString(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (node.nodeType === 2 /* attribute */) return `${node.name}="${node.value}"`;
  if (node.nodeType === 3 /* text */) return node.nodeValue ?? '';
  // Element/document — serialize XML
  try {
    return new XMLSerializer().serializeToString(node);
  } catch {
    return String(node);
  }
}

function nodeKind(node: any): string {
  if (node == null) return 'null';
  if (typeof node === 'string') return 'string';
  if (typeof node === 'number') return 'number';
  if (typeof node === 'boolean') return 'boolean';
  switch (node.nodeType) {
    case 1:
      return 'element';
    case 2:
      return 'attribute';
    case 3:
      return 'text';
    case 4:
      return 'cdata';
    case 7:
      return 'processing-instruction';
    case 8:
      return 'comment';
    case 9:
      return 'document';
    default:
      return 'node';
  }
}

export default function XPathTool() {
  const [xml, setXml] = useState('');
  const [expression, setExpression] = useState('');
  const [namespaces, setNamespaces] = useState<NSPair[]>([
    { prefix: '', uri: '' },
  ]);
  const [error, setError] = useState<string | null>(null);

  const { results, err } = useMemo(() => {
    if (!xml.trim() || !expression.trim())
      return { results: [] as ResultRow[], err: null };
    try {
      const doc = new DOMParser({
        errorHandler: {
          warning: () => {},
          error: (e) => {
            throw new Error(typeof e === 'string' ? e : 'XML parse error');
          },
          fatalError: (e) => {
            throw new Error(typeof e === 'string' ? e : 'XML parse error');
          },
        },
      }).parseFromString(xml, 'text/xml');

      const nsMap: Record<string, string> = {};
      for (const { prefix, uri } of namespaces) {
        if (prefix && uri) nsMap[prefix] = uri;
      }
      const select = Object.keys(nsMap).length
        ? xpath.useNamespaces(nsMap)
        : xpath.select;
      const raw = select(expression, doc);

      let rows: ResultRow[] = [];
      if (Array.isArray(raw)) {
        rows = raw.map((n: any, i) => ({
          index: i + 1,
          type: nodeKind(n),
          value: nodeToString(n),
          nodePath: typeof n === 'object' ? nodePath(n) : undefined,
        }));
      } else {
        rows = [
          {
            index: 1,
            type: nodeKind(raw),
            value: nodeToString(raw),
          },
        ];
      }
      return { results: rows, err: null };
    } catch (e) {
      return { results: [], err: (e as Error).message };
    }
  }, [xml, expression, namespaces]);

  // Surface evaluation errors
  if (err && err !== error) {
    // setState in render is safe via useEffect alternative? Use setError ref pattern.
  }

  return (
    <div className="space-y-4">
      <Panel title="XML document" actions={<CopyButton value={xml} />}>
        <CodeArea
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          placeholder={`<?xml version="1.0"?>\n<bookstore>\n  <book id="b1"><title>Groovy in CPI</title><price>29</price></book>\n  <book id="b2"><title>XSLT Cookbook</title><price>49</price></book>\n</bookstore>`}
          className="h-48"
        />
      </Panel>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="XPath expression" className="lg:col-span-2">
          <textarea
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="textarea code-area h-24"
            placeholder="//book[price > 30]/title/text()"
            spellCheck={false}
          />
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {[
              ['//*', 'all elements'],
              ['//book', 'all <book>'],
              ['//book[1]', 'first book'],
              ['//book/@id', 'all id attrs'],
              ['count(//book)', 'count'],
              ['//book[price>30]/title/text()', 'filter & text'],
            ].map(([expr, label]) => (
              <button
                key={expr}
                onClick={() => setExpression(expr)}
                className="px-2 py-1 rounded-md bg-slate-200/70 dark:bg-navy-700/70 hover:bg-accent/20 hover:text-accent font-mono text-[11px]"
                title={label}
              >
                {expr}
              </button>
            ))}
          </div>
        </Panel>
        <Panel
          title="Namespaces"
          actions={
            <button
              onClick={() =>
                setNamespaces([...namespaces, { prefix: '', uri: '' }])
              }
              className="text-xs font-semibold text-accent"
            >
              + Add
            </button>
          }
        >
          <div className="space-y-1.5 max-h-32 overflow-auto">
            {namespaces.map((n, i) => (
              <div key={i} className="kv-row">
                <input
                  value={n.prefix}
                  onChange={(e) =>
                    setNamespaces(
                      namespaces.map((m, j) =>
                        i === j ? { ...m, prefix: e.target.value } : m
                      )
                    )
                  }
                  placeholder="prefix"
                  className="input py-1 font-mono text-xs"
                />
                <input
                  value={n.uri}
                  onChange={(e) =>
                    setNamespaces(
                      namespaces.map((m, j) =>
                        i === j ? { ...m, uri: e.target.value } : m
                      )
                    )
                  }
                  placeholder="namespace URI"
                  className="input py-1 font-mono text-xs"
                />
                <button
                  onClick={() =>
                    setNamespaces(namespaces.filter((_, j) => j !== i))
                  }
                  className="text-rose-500 text-xs px-1.5"
                  aria-label="Remove namespace"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {err && <ErrorBanner message={err} />}

      <Panel
        title={
          <span className="flex items-center gap-2">
            <ListOrdered className="w-3.5 h-3.5" /> Results
            {results.length > 0 && (
              <span className="text-[11px] normal-case font-normal text-slate-500 dark:text-slate-400">
                {results.length} match{results.length === 1 ? '' : 'es'}
              </span>
            )}
          </span>
        }
      >
        {results.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
            <Crosshair className="w-4 h-4" />
            Enter an XPath expression above to see results.
          </div>
        ) : (
          <div className="overflow-auto max-h-[40vh] rounded-md border border-slate-200 dark:border-navy-700/60">
            <table className="w-full text-xs code-area">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-900/60">
                <tr>
                  <th className="text-left px-2 py-1.5 w-12">#</th>
                  <th className="text-left px-2 py-1.5 w-24">Type</th>
                  <th className="text-left px-2 py-1.5 w-1/3">Path</th>
                  <th className="text-left px-2 py-1.5">Value</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.index}
                    className="border-t border-slate-200 dark:border-navy-700/60 hover:bg-slate-50 dark:hover:bg-navy-900/30"
                  >
                    <td className="px-2 py-1.5 text-slate-400">{r.index}</td>
                    <td className="px-2 py-1.5 text-accent font-semibold">
                      {r.type}
                    </td>
                    <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {r.nodePath ?? '—'}
                    </td>
                    <td className="px-2 py-1.5 whitespace-pre-wrap break-words">
                      {r.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
