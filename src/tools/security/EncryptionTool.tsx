import { useState } from 'react';
import { Lock, Unlock, RefreshCw } from 'lucide-react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';

type Algo = 'AES-GCM' | 'AES-CBC';

function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s+/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  algo: Algo
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 200000, hash: 'SHA-256' },
    baseKey,
    { name: algo, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export default function EncryptionTool() {
  const [algo, setAlgo] = useState<Algo>('AES-GCM');
  const [passphrase, setPassphrase] = useState('');
  const [plain, setPlain] = useState('');
  const [cipher, setCipher] = useState('');
  const [error, setError] = useState<string | null>(null);

  const encrypt = async () => {
    setError(null);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(algo === 'AES-GCM' ? 12 : 16));
      const key = await deriveKey(passphrase, salt, algo);
      const enc = new Uint8Array(
        await crypto.subtle.encrypt(
          { name: algo, iv: iv as BufferSource },
          key,
          new TextEncoder().encode(plain) as BufferSource
        )
      );
      // Encode salt|iv|ct as base64 with prefix tag for clarity
      const blob = new Uint8Array(salt.length + iv.length + enc.length);
      blob.set(salt, 0);
      blob.set(iv, salt.length);
      blob.set(enc, salt.length + iv.length);
      setCipher(`${algo}:${bytesToBase64(blob)}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const decrypt = async () => {
    setError(null);
    try {
      const [hdr, payload] = cipher.split(':');
      if (hdr !== 'AES-GCM' && hdr !== 'AES-CBC')
        throw new Error('Cipher must be prefixed with AES-GCM: or AES-CBC:');
      const blob = base64ToBytes(payload);
      const salt = blob.slice(0, 16);
      const iv = blob.slice(16, hdr === 'AES-GCM' ? 28 : 32);
      const ct = blob.slice(hdr === 'AES-GCM' ? 28 : 32);
      const key = await deriveKey(passphrase, salt, hdr as Algo);
      const out = new Uint8Array(
        await crypto.subtle.decrypt(
          { name: hdr, iv: iv as BufferSource },
          key,
          ct as BufferSource
        )
      );
      setPlain(new TextDecoder().decode(out));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const randomPass = () => {
    const arr = crypto.getRandomValues(new Uint8Array(20));
    let pw = '';
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    for (const b of arr) pw += charset[b % charset.length];
    setPassphrase(pw);
  };

  return (
    <div className="space-y-4">
      <div className="panel p-3 grid sm:grid-cols-3 gap-2 items-end">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Algorithm
          <select
            value={algo}
            onChange={(e) => setAlgo(e.target.value as Algo)}
            className="select py-1.5"
          >
            <option value="AES-GCM">AES-256-GCM (recommended)</option>
            <option value="AES-CBC">AES-256-CBC</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:col-span-2">
          Passphrase
          <div className="flex gap-1">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="input py-1.5 font-mono"
              placeholder="Used with PBKDF2-HMAC-SHA-256, 200k iterations"
            />
            <button
              onClick={randomPass}
              className="btn-secondary !py-1 !px-2 text-xs"
              title="Generate random passphrase"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </label>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel
          title="Plaintext"
          actions={
            <>
              <button onClick={encrypt} className="btn-primary !py-1 !px-2 text-xs">
                <Lock className="w-3 h-3" /> Encrypt →
              </button>
              <CopyButton value={plain} />
            </>
          }
        >
          <CodeArea
            value={plain}
            onChange={(e) => setPlain(e.target.value)}
            className="h-56"
          />
        </Panel>
        <Panel
          title="Ciphertext"
          actions={
            <>
              <button onClick={decrypt} className="btn-secondary !py-1 !px-2 text-xs">
                <Unlock className="w-3 h-3" /> ← Decrypt
              </button>
              <CopyButton value={cipher} />
            </>
          }
        >
          <CodeArea
            value={cipher}
            onChange={(e) => setCipher(e.target.value)}
            placeholder="AES-GCM:base64..."
            className="h-56"
          />
        </Panel>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
        🔒 All operations use the browser's WebCrypto API. The passphrase never leaves your machine.
      </div>
    </div>
  );
}
