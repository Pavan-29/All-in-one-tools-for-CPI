import { useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import Panel from '../../components/common/Panel';
import CopyButton from '../../components/common/CopyButton';
import { useToast } from '../../contexts/ToastContext';

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  // Fallback
  const r = new Uint8Array(16);
  crypto.getRandomValues(r);
  r[6] = (r[6] & 0x0f) | 0x40;
  r[8] = (r[8] & 0x3f) | 0x80;
  const h = Array.from(r).map((b) => b.toString(16).padStart(2, '0'));
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`;
}

function uuidv7(): string {
  // Time-ordered UUID (UUIDv7) - epoch ms in first 48 bits
  const ts = Date.now();
  const tsHex = ts.toString(16).padStart(12, '0');
  const random = new Uint8Array(10);
  crypto.getRandomValues(random);
  random[0] = (random[0] & 0x0f) | 0x70; // version 7
  random[2] = (random[2] & 0x3f) | 0x80; // variant
  const rh = Array.from(random).map((b) => b.toString(16).padStart(2, '0'));
  return `${tsHex.slice(0, 8)}-${tsHex.slice(8, 12)}-${rh.slice(0, 2).join('')}-${rh.slice(2, 4).join('')}-${rh.slice(4, 10).join('')}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function UuidTool() {
  const [generated, setGenerated] = useState<string[]>([uuidv4()]);
  const [count, setCount] = useState(1);
  const [version, setVersion] = useState<'v4' | 'v7'>('v4');
  const [validateInput, setValidateInput] = useState('');
  const { toast } = useToast();

  const generate = () => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(version === 'v4' ? uuidv4() : uuidv7());
    }
    setGenerated(arr);
  };

  const valid = UUID_RE.test(validateInput.trim());
  const variant = valid ? Number.parseInt(validateInput[14], 16) : null;

  return (
    <div className="space-y-4">
      <Panel title="Generate">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Version:
          </span>
          <button
            onClick={() => setVersion('v4')}
            className={`tab-pill ${version === 'v4' ? 'tab-pill-active' : ''}`}
          >
            v4 (random)
          </button>
          <button
            onClick={() => setVersion('v7')}
            className={`tab-pill ${version === 'v7' ? 'tab-pill-active' : ''}`}
          >
            v7 (time-sortable)
          </button>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-3">
            Count:
          </span>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="input py-1 px-2 text-xs w-20"
          />
          <button onClick={generate} className="btn-primary">
            <RefreshCw className="w-3.5 h-3.5" /> Generate
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generated.join('\n'));
              toast('Copied all', 'success');
            }}
            className="btn-secondary"
          >
            <Copy className="w-3.5 h-3.5" /> Copy all
          </button>
        </div>
        <div className="mt-3 max-h-72 overflow-auto rounded-md border border-slate-200 dark:border-navy-700/60 p-2 bg-slate-50 dark:bg-navy-950/40 font-mono text-xs space-y-1">
          {generated.map((u, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span>{u}</span>
              <CopyButton value={u} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Validate">
        <input
          value={validateInput}
          onChange={(e) => setValidateInput(e.target.value)}
          placeholder="Paste a UUID to validate..."
          className="input font-mono text-xs"
        />
        {validateInput && (
          <div
            className={`mt-2 rounded-md border px-3 py-2 text-sm font-mono ${
              valid
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
            }`}
          >
            {valid ? `Valid UUID (variant ${variant})` : 'Invalid UUID format'}
          </div>
        )}
      </Panel>
    </div>
  );
}
