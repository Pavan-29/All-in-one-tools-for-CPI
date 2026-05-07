import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Panel from '../../components/common/Panel';
import CopyButton from '../../components/common/CopyButton';

function safeDate(input: string | number): Date | null {
  if (typeof input === 'number') return new Date(input);
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  // Numeric epoch (sec or ms)
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    return new Date(trimmed.length <= 10 ? num * 1000 : num);
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default function TimestampTool() {
  const [input, setInput] = useState(String(Math.floor(Date.now() / 1000)));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const date = safeDate(input);
  return (
    <div className="space-y-4">
      <Panel title="Convert">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Epoch seconds, ms, or any ISO/RFC date string..."
          className="input font-mono text-sm"
        />
        {date ? (
          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
            <Row label="Epoch (sec)" value={String(Math.floor(date.getTime() / 1000))} />
            <Row label="Epoch (ms)" value={String(date.getTime())} />
            <Row label="ISO 8601 (UTC)" value={date.toISOString()} />
            <Row
              label="ISO 8601 (local)"
              value={`${date.toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`}
            />
            <Row label="UTC" value={date.toUTCString()} />
            <Row
              label="Relative"
              value={relative(date.getTime() - Date.now())}
            />
          </div>
        ) : (
          <div className="mt-3 text-sm text-rose-500">Invalid date input.</div>
        )}
      </Panel>
      <Panel title="Now">
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Row label="Epoch (sec)" value={String(Math.floor(now / 1000))} />
          <Row label="Epoch (ms)" value={String(now)} />
          <Row label="ISO 8601 (UTC)" value={new Date(now).toISOString()} />
          <Row label="Local" value={new Date(now).toLocaleString()} />
        </div>
        <div className="mt-3">
          <button
            onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
            className="btn-secondary"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Use current epoch
          </button>
        </div>
      </Panel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-32 text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <input value={value} readOnly className="input py-1 px-2 text-xs font-mono" />
      <CopyButton value={value} />
    </div>
  );
}

function relative(ms: number): string {
  const abs = Math.abs(ms);
  const sec = Math.round(abs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  let txt: string;
  if (sec < 60) txt = `${sec}s`;
  else if (min < 60) txt = `${min}m`;
  else if (hr < 48) txt = `${hr}h`;
  else txt = `${day}d`;
  return ms < 0 ? `${txt} ago` : `in ${txt}`;
}
