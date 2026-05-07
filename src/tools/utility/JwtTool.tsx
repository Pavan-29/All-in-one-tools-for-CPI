import { useMemo, useState } from 'react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';

function base64UrlDecode(input: string): string {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return decodeURIComponent(
    Array.from(atob(s))
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

interface Decoded {
  header: any;
  payload: any;
  signature: string;
  expiresAt?: Date;
  issuedAt?: Date;
  notBefore?: Date;
  isExpired?: boolean;
}

export default function JwtTool() {
  const [token, setToken] = useState('');

  const { decoded, error } = useMemo<{ decoded: Decoded | null; error: string | null }>(
    () => {
      const trimmed = token.trim();
      if (!trimmed) return { decoded: null, error: null };
      const parts = trimmed.split('.');
      if (parts.length < 2) return { decoded: null, error: 'Token must have at least 2 segments' };
      try {
        const header = JSON.parse(base64UrlDecode(parts[0]));
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        const signature = parts[2] ?? '';
        const out: Decoded = { header, payload, signature };
        if (payload.exp) {
          out.expiresAt = new Date(payload.exp * 1000);
          out.isExpired = out.expiresAt.getTime() < Date.now();
        }
        if (payload.iat) out.issuedAt = new Date(payload.iat * 1000);
        if (payload.nbf) out.notBefore = new Date(payload.nbf * 1000);
        return { decoded: out, error: null };
      } catch (e) {
        return { decoded: null, error: (e as Error).message };
      }
    },
    [token]
  );

  return (
    <div className="space-y-4">
      <Panel title="JWT (encoded)" actions={<CopyButton value={token} />}>
        <CodeArea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4eHgifQ.signature"
          className="h-32"
        />
      </Panel>
      {error && <ErrorBanner message={error} />}
      {decoded && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="Header" actions={<CopyButton value={JSON.stringify(decoded.header, null, 2)} />}>
            <pre className="code-area whitespace-pre-wrap text-xs">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </Panel>
          <Panel title="Payload" actions={<CopyButton value={JSON.stringify(decoded.payload, null, 2)} />}>
            <pre className="code-area whitespace-pre-wrap text-xs">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </Panel>
          <Panel title="Claims summary" className="lg:col-span-2">
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <KV label="Algorithm" value={decoded.header.alg} />
              <KV label="Type" value={decoded.header.typ} />
              <KV label="Issuer" value={decoded.payload.iss} />
              <KV label="Subject" value={decoded.payload.sub} />
              <KV label="Audience" value={JSON.stringify(decoded.payload.aud)} />
              {decoded.issuedAt && (
                <KV label="Issued at" value={decoded.issuedAt.toLocaleString()} />
              )}
              {decoded.expiresAt && (
                <KV
                  label="Expires at"
                  value={`${decoded.expiresAt.toLocaleString()}${
                    decoded.isExpired ? ' (expired!)' : ''
                  }`}
                  highlight={decoded.isExpired}
                />
              )}
              {decoded.notBefore && (
                <KV label="Not before" value={decoded.notBefore.toLocaleString()} />
              )}
              <KV
                label="Signature"
                value={
                  decoded.signature
                    ? decoded.signature.slice(0, 24) + '…'
                    : '(none)'
                }
              />
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function KV({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`font-mono ${
          highlight ? 'text-rose-500 font-bold' : 'text-slate-800 dark:text-slate-200'
        }`}
      >
        {value || '—'}
      </span>
    </div>
  );
}
