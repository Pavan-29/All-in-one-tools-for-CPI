import { useMemo, useState } from 'react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import ErrorBanner from '../../components/common/ErrorBanner';

const FLAGS: Array<[string, string]> = [
  ['g', 'global'],
  ['i', 'ignore case'],
  ['m', 'multi-line'],
  ['s', 'dotAll'],
  ['u', 'unicode'],
  ['y', 'sticky'],
];

export default function RegexTool() {
  const [pattern, setPattern] = useState('([A-Z][a-z]+)\\s+(\\d+)');
  const [text, setText] = useState('Order 1001 by Alice 28 and Bob 31');
  const [flags, setFlags] = useState<string>('g');

  const { highlighted, matches, error } = useMemo(() => {
    if (!pattern) return { highlighted: text, matches: [], error: null as null | string };
    let re: RegExp;
    try {
      re = new RegExp(pattern, flags);
    } catch (e) {
      return { highlighted: text, matches: [], error: (e as Error).message };
    }
    const all: Array<{ index: number; full: string; groups: string[] }> = [];
    let html = '';
    let lastIndex = 0;
    if (flags.includes('g')) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        all.push({ index: m.index, full: m[0], groups: m.slice(1) });
        html += escapeHtml(text.slice(lastIndex, m.index));
        html += `<mark class="bg-accent/30 rounded px-0.5">${escapeHtml(m[0])}</mark>`;
        lastIndex = m.index + (m[0].length || 1);
        if (!m[0]) re.lastIndex++;
      }
    } else {
      const m = re.exec(text);
      if (m) {
        all.push({ index: m.index, full: m[0], groups: m.slice(1) });
        html += escapeHtml(text.slice(0, m.index));
        html += `<mark class="bg-accent/30 rounded px-0.5">${escapeHtml(m[0])}</mark>`;
        lastIndex = m.index + m[0].length;
      }
    }
    html += escapeHtml(text.slice(lastIndex));
    return { highlighted: html, matches: all, error: null };
  }, [pattern, text, flags]);

  return (
    <div className="space-y-4">
      <Panel title="Pattern">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-accent">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="input py-1.5 font-mono"
          />
          <span className="text-accent">/</span>
          <input
            value={flags}
            onChange={(e) =>
              setFlags(
                Array.from(new Set(e.target.value.replace(/[^gimsuy]/g, '')))
                  .join('')
                  .slice(0, 6)
              )
            }
            className="input py-1.5 font-mono w-20"
            placeholder="flags"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {FLAGS.map(([f, label]) => (
            <label
              key={f}
              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={flags.includes(f)}
                onChange={(e) =>
                  setFlags(
                    e.target.checked
                      ? Array.from(new Set(flags + f)).join('')
                      : flags.replace(f, '')
                  )
                }
                className="accent-accent"
              />
              <span className="font-mono font-bold">{f}</span> {label}
            </label>
          ))}
        </div>
      </Panel>
      {error && <ErrorBanner message={error} />}
      <Panel title="Test string">
        <CodeArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-40"
        />
      </Panel>
      <Panel title="Highlighted">
        <pre
          className="code-area whitespace-pre-wrap break-words p-2 max-h-56 overflow-auto rounded-md bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-700/60"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </Panel>
      <Panel
        title={
          <span>
            Matches{' '}
            <span className="text-[11px] normal-case font-normal text-slate-500 dark:text-slate-400">
              {matches.length} found
            </span>
          </span>
        }
      >
        {matches.length === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No matches yet.
          </div>
        ) : (
          <div className="overflow-auto max-h-64 rounded-md border border-slate-200 dark:border-navy-700/60">
            <table className="w-full text-xs code-area">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-900/60">
                <tr>
                  <th className="text-left px-2 py-1.5">#</th>
                  <th className="text-left px-2 py-1.5">Index</th>
                  <th className="text-left px-2 py-1.5">Match</th>
                  <th className="text-left px-2 py-1.5">Groups</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-200 dark:border-navy-700/60"
                  >
                    <td className="px-2 py-1 text-slate-400">{i + 1}</td>
                    <td className="px-2 py-1">{m.index}</td>
                    <td className="px-2 py-1 text-accent">{m.full}</td>
                    <td className="px-2 py-1 text-slate-500 dark:text-slate-400">
                      {m.groups.length ? m.groups.join(' · ') : '—'}
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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
