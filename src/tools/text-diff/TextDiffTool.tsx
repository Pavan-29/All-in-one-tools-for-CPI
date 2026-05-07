import { useMemo, useState } from 'react';
import {
  diffLines,
  diffWordsWithSpace,
  diffChars,
  Change,
} from 'diff';
import {
  Eraser,
  Sparkles,
  ArrowLeftRight,
  Plus,
  Minus,
  Equal,
  ScanText,
} from 'lucide-react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import { useToast } from '../../contexts/ToastContext';
import { formatJson } from '../../utils/json';
import { formatXml } from '../../utils/xml';

type DiffMode = 'line' | 'word' | 'char';
type Granularity = 'inline' | 'side-by-side';

function tryAutoFormat(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  // Try JSON first
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return formatJson(trimmed, 2);
    } catch {
      /* fall through */
    }
  }
  // Try XML
  if (trimmed.startsWith('<')) {
    try {
      return formatXml(trimmed);
    } catch {
      /* fall through */
    }
  }
  return text;
}

export default function TextDiffTool() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [mode, setMode] = useState<DiffMode>('line');
  const [view, setView] = useState<Granularity>('side-by-side');
  const [ignoreWS, setIgnoreWS] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const { toast } = useToast();

  const changes: Change[] = useMemo(() => {
    if (!left && !right) return [];
    const opts: any = {
      ignoreCase: ignoreCase,
      ignoreWhitespace: ignoreWS,
    };
    if (mode === 'word') return diffWordsWithSpace(left, right, opts);
    if (mode === 'char') return diffChars(left, right, opts);
    return diffLines(left, right, opts);
  }, [left, right, mode, ignoreWS, ignoreCase]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let same = 0;
    for (const c of changes) {
      const count = c.count ?? c.value.split(/\r?\n/).length;
      if (c.added) added += count;
      else if (c.removed) removed += count;
      else same += count;
    }
    return { added, removed, same };
  }, [changes]);

  const swap = () => {
    setLeft(right);
    setRight(left);
  };

  const handleFormat = () => {
    setLeft(tryAutoFormat(left));
    setRight(tryAutoFormat(right));
    toast('Auto-formatted both sides', 'success');
  };

  const handleClear = () => {
    setLeft('');
    setRight('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 panel p-3">
        <div className="flex items-center gap-1 mr-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Granularity:
          </span>
          {(['line', 'word', 'char'] as DiffMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`tab-pill ${mode === m ? 'tab-pill-active' : ''}`}
            >
              {m === 'line' ? 'Line' : m === 'word' ? 'Word' : 'Char'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 mr-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            View:
          </span>
          <button
            onClick={() => setView('side-by-side')}
            className={`tab-pill ${
              view === 'side-by-side' ? 'tab-pill-active' : ''
            }`}
          >
            Side by side
          </button>
          <button
            onClick={() => setView('inline')}
            className={`tab-pill ${view === 'inline' ? 'tab-pill-active' : ''}`}
          >
            Inline
          </button>
        </div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={ignoreWS}
            onChange={(e) => setIgnoreWS(e.target.checked)}
            className="accent-accent"
          />
          Ignore whitespace
        </label>
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={ignoreCase}
            onChange={(e) => setIgnoreCase(e.target.checked)}
            className="accent-accent"
          />
          Ignore case
        </label>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={handleFormat} className="btn-secondary" title="Auto-format both sides">
            <Sparkles className="w-3.5 h-3.5" />
            Auto-format
          </button>
          <button onClick={swap} className="btn-secondary" title="Swap A and B">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Swap
          </button>
          <button onClick={handleClear} className="btn-ghost" title="Clear both panes">
            <Eraser className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Panel
          title={
            <span>
              <span className="text-xs uppercase tracking-wider mr-2">A</span>
              <span className="text-slate-700 dark:text-slate-200">Original</span>
            </span>
          }
          actions={<CopyButton value={left} />}
        >
          <CodeArea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="Paste XML / JSON / Text A here..."
            className="h-72"
          />
        </Panel>
        <Panel
          title={
            <span>
              <span className="text-xs uppercase tracking-wider mr-2">B</span>
              <span className="text-slate-700 dark:text-slate-200">Modified</span>
            </span>
          }
          actions={<CopyButton value={right} />}
        >
          <CodeArea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="Paste XML / JSON / Text B here..."
            className="h-72"
          />
        </Panel>
      </div>

      <Panel
        title={
          <span className="flex items-center gap-3">
            <ScanText className="w-3.5 h-3.5" /> Differences
            <span className="ml-2 inline-flex items-center gap-3 text-[11px] normal-case tracking-normal font-normal">
              <span className="inline-flex items-center gap-1 text-emerald-500">
                <Plus className="w-3 h-3" /> {stats.added}
              </span>
              <span className="inline-flex items-center gap-1 text-rose-500">
                <Minus className="w-3 h-3" /> {stats.removed}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Equal className="w-3 h-3" /> {stats.same}
              </span>
            </span>
          </span>
        }
      >
        {changes.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Paste payloads in both panes above to see the differences.
          </div>
        ) : view === 'inline' ? (
          <DiffInline changes={changes} />
        ) : (
          <DiffSideBySide left={left} right={right} changes={changes} mode={mode} />
        )}
      </Panel>
    </div>
  );
}

function DiffInline({ changes }: { changes: Change[] }) {
  return (
    <pre className="code-area whitespace-pre-wrap break-words p-2 max-h-[60vh] overflow-auto rounded-md bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-700/60">
      {changes.map((c, i) => {
        const cls = c.added ? 'diff-add' : c.removed ? 'diff-del' : 'diff-eq';
        const prefix = c.added ? '+ ' : c.removed ? '- ' : '  ';
        // For line-mode, prefix each line
        const lines = c.value.split('\n');
        return lines.map((line, j) => {
          if (j === lines.length - 1 && line === '') return null;
          return (
            <span key={`${i}-${j}`} className={cls}>
              <span className="select-none opacity-60">{prefix}</span>
              {line}
              <br />
            </span>
          );
        });
      })}
    </pre>
  );
}

function DiffSideBySide({
  left,
  right,
  changes,
  mode,
}: {
  left: string;
  right: string;
  changes: Change[];
  mode: DiffMode;
}) {
  // Build aligned line-pairs for side-by-side display.
  // For non-line modes we still show line-aligned context but with inline highlights.
  const pairs: Array<{
    leftLine: string | null;
    rightLine: string | null;
    leftMark?: 'del' | 'eq';
    rightMark?: 'add' | 'eq';
  }> = [];

  if (mode === 'line') {
    let li = 0;
    let ri = 0;
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    for (const c of changes) {
      const lines = c.value.split('\n');
      // last element may be '' if value ends with \n
      const trimmedLines =
        lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines;
      if (c.removed) {
        for (const _line of trimmedLines) {
          pairs.push({
            leftLine: leftLines[li++] ?? '',
            rightLine: null,
            leftMark: 'del',
          });
        }
      } else if (c.added) {
        for (const _line of trimmedLines) {
          pairs.push({
            leftLine: null,
            rightLine: rightLines[ri++] ?? '',
            rightMark: 'add',
          });
        }
      } else {
        for (const _line of trimmedLines) {
          pairs.push({
            leftLine: leftLines[li++] ?? '',
            rightLine: rightLines[ri++] ?? '',
            leftMark: 'eq',
            rightMark: 'eq',
          });
        }
      }
    }
  } else {
    // For word/char modes — show each side with inline highlights
    const leftHTML = changes
      .filter((c) => !c.added)
      .map((c) =>
        c.removed
          ? `<span class="diff-del">${escapeHtml(c.value)}</span>`
          : escapeHtml(c.value)
      )
      .join('');
    const rightHTML = changes
      .filter((c) => !c.removed)
      .map((c) =>
        c.added
          ? `<span class="diff-add">${escapeHtml(c.value)}</span>`
          : escapeHtml(c.value)
      )
      .join('');
    return (
      <div className="grid md:grid-cols-2 gap-3 max-h-[60vh] overflow-auto">
        <pre
          className="code-area whitespace-pre-wrap break-words p-2 rounded-md bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-700/60"
          dangerouslySetInnerHTML={{ __html: leftHTML }}
        />
        <pre
          className="code-area whitespace-pre-wrap break-words p-2 rounded-md bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-700/60"
          dangerouslySetInnerHTML={{ __html: rightHTML }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 dark:border-navy-700/60 overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_auto_1fr] code-area max-h-[60vh] overflow-auto bg-slate-50 dark:bg-navy-950/60">
        {pairs.map((p, i) => (
          <DiffRow key={i} index={i + 1} pair={p} />
        ))}
      </div>
    </div>
  );
}

function DiffRow({
  index,
  pair,
}: {
  index: number;
  pair: {
    leftLine: string | null;
    rightLine: string | null;
    leftMark?: 'del' | 'eq';
    rightMark?: 'add' | 'eq';
  };
}) {
  const leftCls =
    pair.leftMark === 'del'
      ? 'diff-del'
      : pair.leftMark === 'eq'
        ? 'diff-eq'
        : '';
  const rightCls =
    pair.rightMark === 'add'
      ? 'diff-add'
      : pair.rightMark === 'eq'
        ? 'diff-eq'
        : '';
  return (
    <>
      <span className="px-2 py-0.5 select-none text-[11px] text-slate-400 text-right border-r border-slate-200 dark:border-navy-700/60">
        {pair.leftLine !== null ? index : ''}
      </span>
      <span
        className={`px-3 py-0.5 whitespace-pre-wrap break-words ${leftCls}`}
      >
        {pair.leftLine ?? ' '}
      </span>
      <span className="px-2 py-0.5 select-none text-[11px] text-slate-400 text-right border-l border-r border-slate-200 dark:border-navy-700/60">
        {pair.rightLine !== null ? index : ''}
      </span>
      <span
        className={`px-3 py-0.5 whitespace-pre-wrap break-words ${rightCls}`}
      >
        {pair.rightLine ?? ' '}
      </span>
    </>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
