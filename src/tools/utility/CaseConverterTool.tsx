import { useMemo, useState } from 'react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';

function tokenize(s: string): string[] {
  return s
    .replace(/[_\-\.]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean);
}

const variants: Array<[string, (tokens: string[]) => string]> = [
  ['camelCase', (t) => t.map((w, i) => (i === 0 ? w.toLowerCase() : cap(w))).join('')],
  ['PascalCase', (t) => t.map(cap).join('')],
  ['snake_case', (t) => t.map((w) => w.toLowerCase()).join('_')],
  ['SCREAMING_SNAKE', (t) => t.map((w) => w.toUpperCase()).join('_')],
  ['kebab-case', (t) => t.map((w) => w.toLowerCase()).join('-')],
  ['Title Case', (t) => t.map(cap).join(' ')],
  ['Sentence case', (t) => t.map((w, i) => (i === 0 ? cap(w) : w.toLowerCase())).join(' ')],
  ['lower case', (t) => t.map((w) => w.toLowerCase()).join(' ')],
  ['UPPER CASE', (t) => t.map((w) => w.toUpperCase()).join(' ')],
  ['Path/Style', (t) => t.map((w) => w.toLowerCase()).join('/')],
  ['dot.notation', (t) => t.map((w) => w.toLowerCase()).join('.')],
];

function cap(w: string): string {
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

export default function CaseConverterTool() {
  const [input, setInput] = useState('orderItemId');
  const tokens = useMemo(() => tokenize(input), [input]);

  return (
    <div className="space-y-4">
      <Panel title="Input">
        <CodeArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="orderItemId, ORDER_ID, order-item-id, ..."
          className="h-24"
        />
      </Panel>
      <Panel
        title={
          <span>
            Variants{' '}
            <span className="text-[11px] normal-case font-normal text-slate-500 dark:text-slate-400">
              {tokens.length} tokens detected
            </span>
          </span>
        }
      >
        <div className="grid sm:grid-cols-2 gap-2">
          {variants.map(([name, fn]) => {
            const out = fn(tokens);
            return (
              <div key={name} className="flex items-center gap-2">
                <span className="w-32 text-xs text-slate-500 dark:text-slate-400">
                  {name}
                </span>
                <input
                  value={out}
                  readOnly
                  className="input py-1 px-2 text-xs font-mono"
                />
                <CopyButton value={out} />
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
