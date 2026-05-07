import { useState } from 'react';
import { ArrowRightLeft, Eraser } from 'lucide-react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';

function utf8Encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}
function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
}
function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  let b64 = btoa(binary);
  if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64;
}
function base64ToBytes(b64: string, urlSafe = false): Uint8Array {
  let s = b64.replace(/\s+/g, '');
  if (urlSafe) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
  }
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function Base64Tool() {
  const [plain, setPlain] = useState('');
  const [encoded, setEncoded] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encode = () => {
    try {
      setEncoded(bytesToBase64(utf8Encode(plain), urlSafe));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const decode = () => {
    try {
      setPlain(utf8Decode(base64ToBytes(encoded, urlSafe)));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <div className="space-y-4">
      <div className="panel p-3 flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={urlSafe}
            onChange={(e) => setUrlSafe(e.target.checked)}
            className="accent-accent"
          />
          URL-safe (Base64URL)
        </label>
        <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">
          UTF-8 encoded
        </span>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel
          title="Plain text"
          actions={
            <>
              <button onClick={encode} className="btn-primary !py-1 !px-2 text-xs">
                Encode →
              </button>
              <CopyButton value={plain} />
            </>
          }
        >
          <CodeArea
            value={plain}
            onChange={(e) => setPlain(e.target.value)}
            placeholder="Plain text..."
            className="h-72"
          />
        </Panel>
        <Panel
          title="Base64"
          actions={
            <>
              <button onClick={decode} className="btn-secondary !py-1 !px-2 text-xs">
                ← Decode
              </button>
              <CopyButton value={encoded} />
            </>
          }
        >
          <CodeArea
            value={encoded}
            onChange={(e) => setEncoded(e.target.value)}
            placeholder="Base64..."
            className="h-72"
          />
        </Panel>
      </div>
      <div className="text-center">
        <button
          onClick={() => {
            setPlain('');
            setEncoded('');
            setError(null);
          }}
          className="btn-ghost"
        >
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}
