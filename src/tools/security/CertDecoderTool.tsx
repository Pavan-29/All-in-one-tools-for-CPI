import { useState } from 'react';
import { Fingerprint, Eraser, Play } from 'lucide-react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';
import { decodeCertificate, type CertSummary } from '../../utils/asn1';

export default function CertDecoderTool() {
  const [pem, setPem] = useState('');
  const [summary, setSummary] = useState<CertSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = async () => {
    setError(null);
    try {
      setSummary(await decodeCertificate(pem));
    } catch (e) {
      setError((e as Error).message);
      setSummary(null);
    }
  };

  return (
    <div className="space-y-4">
      <Panel title="PEM / Base64 Certificate" actions={<CopyButton value={pem} />}>
        <CodeArea
          value={pem}
          onChange={(e) => setPem(e.target.value)}
          placeholder="-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----"
          className="h-56"
        />
      </Panel>
      {error && <ErrorBanner message={error} />}
      <div className="flex justify-center gap-2">
        <button onClick={handleDecode} className="btn-primary">
          <Play className="w-4 h-4" /> Decode certificate
        </button>
        <button
          onClick={() => {
            setPem('');
            setSummary(null);
            setError(null);
          }}
          className="btn-ghost"
        >
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
      {summary && (
        <Panel
          title={
            <span className="flex items-center gap-2">
              <Fingerprint className="w-3.5 h-3.5" /> Certificate summary
            </span>
          }
        >
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <Field label="Version" value={`v${summary.version}`} />
            <Field label="Serial number" value={summary.serialNumber} />
            <Field
              label="Subject"
              value={summary.subject}
              wide
            />
            <Field label="Issuer" value={summary.issuer} wide />
            <Field label="Not before" value={summary.notBefore} />
            <Field
              label="Not after"
              value={summary.notAfter}
              danger={summary.isExpired}
            />
            <Field label="Signature algorithm" value={summary.signatureAlgorithm} />
            <Field
              label="Public key"
              value={`${summary.publicKeyAlgorithm}${summary.publicKeyBits ? ` (${summary.publicKeyBits} bits)` : ''}`}
            />
            <Field
              label="SHA-256 Fingerprint"
              value={summary.fingerprintSha256}
              wide
            />
          </div>
        </Panel>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  wide,
  danger,
}: {
  label: string;
  value?: string;
  wide?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="w-32 text-slate-500 dark:text-slate-400 shrink-0">
        {label}
      </span>
      <input
        value={value ?? ''}
        readOnly
        className={`input py-1 px-2 font-mono text-xs ${danger ? 'text-rose-500 font-bold' : ''}`}
      />
      <CopyButton value={value ?? ''} />
    </div>
  );
}
