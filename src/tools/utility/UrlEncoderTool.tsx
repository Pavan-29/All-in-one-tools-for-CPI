import { useState } from 'react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';

type Mode = 'component' | 'full';

export default function UrlEncoderTool() {
  const [plain, setPlain] = useState('');
  const [encoded, setEncoded] = useState('');
  const [mode, setMode] = useState<Mode>('component');
  const [error, setError] = useState<string | null>(null);

  const encode = () => {
    try {
      setEncoded(
        mode === 'component' ? encodeURIComponent(plain) : encodeURI(plain)
      );
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const decode = () => {
    try {
      setPlain(
        mode === 'component' ? decodeURIComponent(encoded) : decodeURI(encoded)
      );
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel p-3 flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Mode:
        </span>
        <button
          onClick={() => setMode('component')}
          className={`tab-pill ${mode === 'component' ? 'tab-pill-active' : ''}`}
        >
          Component (encodeURIComponent)
        </button>
        <button
          onClick={() => setMode('full')}
          className={`tab-pill ${mode === 'full' ? 'tab-pill-active' : ''}`}
        >
          Full URI (encodeURI)
        </button>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel
          title="Plain"
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
            placeholder="https://example.com/path?key=hello world&q=foo bar"
            className="h-56"
          />
        </Panel>
        <Panel
          title="Encoded"
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
            placeholder="https%3A%2F%2Fexample.com%2Fpath..."
            className="h-56"
          />
        </Panel>
      </div>
    </div>
  );
}
