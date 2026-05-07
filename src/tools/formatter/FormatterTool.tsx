import { useMemo, useState } from 'react';
import {
  Sparkles,
  Minimize2,
  Eraser,
  ShieldCheck,
  ArrowDown,
} from 'lucide-react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';
import { formatJson, jsonValidate, minifyJson } from '../../utils/json';
import { formatXml, minifyXml, validateXml } from '../../utils/xml';
import { useToast } from '../../contexts/ToastContext';

type Mode = 'json' | 'xml' | 'auto';

function detect(source: string): 'json' | 'xml' | 'unknown' {
  const t = source.trim();
  if (!t) return 'unknown';
  if (
    (t.startsWith('{') && t.endsWith('}')) ||
    (t.startsWith('[') && t.endsWith(']'))
  )
    return 'json';
  if (t.startsWith('<')) return 'xml';
  return 'unknown';
}

export default function FormatterTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('auto');
  const [indent, setIndent] = useState(2);
  const { toast } = useToast();

  const detected = useMemo(() => detect(input), [input]);
  const effectiveMode: 'json' | 'xml' | 'unknown' =
    mode === 'auto' ? detected : mode;

  const handleFormat = () => {
    try {
      if (effectiveMode === 'json') {
        setOutput(formatJson(input, indent));
        setError(null);
        toast('Formatted JSON', 'success');
      } else if (effectiveMode === 'xml') {
        setOutput(formatXml(input, indent));
        setError(null);
        toast('Formatted XML', 'success');
      } else {
        setError('Cannot detect format. Please choose JSON or XML manually.');
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  };

  const handleMinify = () => {
    try {
      if (effectiveMode === 'json') {
        setOutput(minifyJson(input));
        setError(null);
      } else if (effectiveMode === 'xml') {
        setOutput(minifyXml(input));
        setError(null);
      } else {
        setError('Cannot detect format.');
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleValidate = () => {
    if (effectiveMode === 'json') {
      const r = jsonValidate(input);
      if (r.ok) {
        toast('JSON is valid ✓', 'success');
        setError(null);
      } else {
        setError(r.error);
      }
    } else if (effectiveMode === 'xml') {
      const r = validateXml(input);
      if (r.ok) {
        toast('XML is well-formed ✓', 'success');
        setError(null);
      } else {
        setError(r.error);
      }
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="panel p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Format:
          </span>
          {(['auto', 'json', 'xml'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`tab-pill ${mode === m ? 'tab-pill-active' : ''}`}
            >
              {m.toUpperCase()}
            </button>
          ))}
          {mode === 'auto' && (
            <span className="ml-2 text-[11px] text-slate-500 dark:text-slate-400">
              Detected:{' '}
              <span className="font-mono uppercase text-accent">
                {detected}
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Indent:
          </span>
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            className="select py-1 text-sm w-auto"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={1}>tab (1)</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={handleValidate} className="btn-secondary">
            <ShieldCheck className="w-3.5 h-3.5" /> Validate
          </button>
          <button onClick={handleMinify} className="btn-secondary">
            <Minimize2 className="w-3.5 h-3.5" /> Minify
          </button>
          <button onClick={handleFormat} className="btn-primary">
            <Sparkles className="w-3.5 h-3.5" /> Format
          </button>
          <button onClick={handleClear} className="btn-ghost">
            <Eraser className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel
          title="Input"
          actions={<CopyButton value={input} />}
        >
          <CodeArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste raw or messy JSON/XML here..."
            className="h-[60vh]"
          />
        </Panel>
        <Panel
          title={
            <span className="flex items-center gap-1.5">
              Output
              <ArrowDown className="w-3.5 h-3.5 lg:hidden" />
            </span>
          }
          actions={<CopyButton value={output} />}
        >
          <CodeArea
            value={output}
            readOnly
            placeholder="Formatted output appears here..."
            className="h-[60vh]"
          />
        </Panel>
      </div>
    </div>
  );
}
