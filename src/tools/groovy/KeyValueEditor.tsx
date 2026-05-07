import { Trash2 } from 'lucide-react';

export interface KVPair {
  key: string;
  value: string;
}

interface Props {
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  readOnly?: boolean;
}

export default function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  readOnly,
}: Props) {
  const updateAt = (i: number, patch: Partial<KVPair>) => {
    onChange(pairs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };
  const removeAt = (i: number) => onChange(pairs.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span>Key</span>
        <span>Value</span>
        <span></span>
      </div>
      {pairs.length === 0 && (
        <div className="text-xs italic text-slate-400">empty</div>
      )}
      {pairs.map((p, i) => (
        <div key={i} className="kv-row">
          <input
            value={p.key}
            onChange={(e) => updateAt(i, { key: e.target.value })}
            placeholder={keyPlaceholder}
            readOnly={readOnly}
            className="input py-1 px-2 text-xs font-mono"
          />
          <input
            value={p.value}
            onChange={(e) => updateAt(i, { value: e.target.value })}
            placeholder={valuePlaceholder}
            readOnly={readOnly}
            className="input py-1 px-2 text-xs font-mono"
          />
          {!readOnly && (
            <button
              onClick={() => removeAt(i)}
              className="text-rose-500 hover:text-rose-600 px-1.5"
              aria-label="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
