import { useState } from 'react';
import { Play, Plus, Trash2, Wand2, Eraser, FileText } from 'lucide-react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';
import KeyValueEditor, { KVPair } from './KeyValueEditor';
import OutputColumns from './OutputColumns';
import { runScript } from '../../utils/scriptRunner';
import type { CpiMessageState } from '../../utils/cpiMessage';
import { useToast } from '../../contexts/ToastContext';

type Tab = 'groovy' | 'xslt' | 'value';
type Lang = 'groovy' | 'javascript';

const SAMPLE_GROOVY = `import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.JsonSlurper
import groovy.json.JsonOutput

def Message processData(Message message) {
    def body = message.getBody(String) ?: ''
    def headers = message.getHeaders()
    def props = message.getProperties()

    // Example: parse JSON, mutate, write back
    if (body?.trim()?.startsWith('{')) {
        def slurper = new JsonSlurper()
        def obj = slurper.parseText(body)
        obj.processedAt = new Date().toString()
        obj.dynamicId = props.dynamicId
        message.setBody(JsonOutput.prettyPrint(JsonOutput.toJson(obj)))
    } else {
        message.setBody("Hello \${headers.oldHeader ?: 'World'}!")
    }

    message.setHeader('newHeader', 'set-by-script')
    message.setProperty('processed', 'true')

    def log = messageLog
    log.setStringProperty('lastRun', new Date().toString())
    return message
}`;

export default function GroovyTool() {
  const [tab, setTab] = useState<Tab>('groovy');
  const [language, setLanguage] = useState<Lang>('groovy');
  const [script, setScript] = useState(SAMPLE_GROOVY);
  const [fnName, setFnName] = useState('processData');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState<KVPair[]>([
    { key: 'oldHeader', value: 'Hello!' },
  ]);
  const [properties, setProperties] = useState<KVPair[]>([
    { key: 'dynamicId', value: 'MessageFlow_1' },
  ]);
  const [output, setOutput] = useState<CpiMessageState | null>(null);
  const [consoleLog, setConsoleLog] = useState<
    Array<{ level: string; text: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRun = () => {
    const initial: CpiMessageState = {
      body,
      headers: Object.fromEntries(
        headers.filter((h) => h.key).map((h) => [h.key, h.value])
      ),
      properties: Object.fromEntries(
        properties.filter((p) => p.key).map((p) => [p.key, p.value])
      ),
      attachments: [],
      logProperties: [],
      customHeaderProperties: {},
      consoleLog: [],
    };
    const result = runScript({
      language,
      script,
      fnName: fnName || 'processData',
      initial,
    });
    setConsoleLog(result.console);
    if (!result.ok) {
      setError(result.error ?? 'Script execution failed');
      setOutput(result.state);
      toast('Script error', 'error');
    } else {
      setError(null);
      setOutput(result.state);
      toast('Script executed', 'success');
    }
  };

  const handleClear = () => {
    setOutput(null);
    setError(null);
    setConsoleLog([]);
  };

  return (
    <div className="space-y-4">
      {/* Tabs row matching screenshot */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          ['groovy', 'Groovy Script'],
          ['xslt', 'XSLT Mapping'],
          ['value', 'Value Mapping'],
        ] as Array<[Tab, string]>).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`tab-pill ${tab === id ? 'tab-pill-active' : ''}`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Language
          </span>
          <div className="flex">
            {(['groovy', 'javascript'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`tab-pill ${language === l ? 'tab-pill-active' : ''}`}
              >
                {l === 'groovy' ? 'Groovy (transpiled)' : 'JavaScript'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'groovy' ? (
        <GroovyPanel
          script={script}
          setScript={setScript}
          fnName={fnName}
          setFnName={setFnName}
          body={body}
          setBody={setBody}
          headers={headers}
          setHeaders={setHeaders}
          properties={properties}
          setProperties={setProperties}
          output={output}
          consoleLog={consoleLog}
          error={error}
          handleRun={handleRun}
          handleClear={handleClear}
          language={language}
        />
      ) : tab === 'xslt' ? (
        <NavigateAway label="XSLT Mapping" id="xslt" />
      ) : (
        <NavigateAway label="Value Mapping" id="value-mapping" />
      )}
    </div>
  );
}

interface GroovyPanelProps {
  script: string;
  setScript: (s: string) => void;
  fnName: string;
  setFnName: (s: string) => void;
  body: string;
  setBody: (s: string) => void;
  headers: KVPair[];
  setHeaders: (k: KVPair[]) => void;
  properties: KVPair[];
  setProperties: (k: KVPair[]) => void;
  output: CpiMessageState | null;
  consoleLog: Array<{ level: string; text: string }>;
  error: string | null;
  handleRun: () => void;
  handleClear: () => void;
  language: Lang;
}

function GroovyPanel({
  script,
  setScript,
  fnName,
  setFnName,
  body,
  setBody,
  headers,
  setHeaders,
  properties,
  setProperties,
  output,
  consoleLog,
  error,
  handleRun,
  handleClear,
  language,
}: GroovyPanelProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* INPUT column */}
      <div className="space-y-3">
        <Panel title="Input · Body" actions={<CopyButton value={body} />}>
          <CodeArea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Paste incoming XML / JSON payload here..."
            className="h-56"
          />
        </Panel>
        <Panel
          title="Headers"
          actions={
            <button
              onClick={() => setHeaders([...headers, { key: '', value: '' }])}
              className="text-xs font-semibold text-accent flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> add
            </button>
          }
        >
          <KeyValueEditor pairs={headers} onChange={setHeaders} />
        </Panel>
        <Panel
          title="Properties"
          actions={
            <button
              onClick={() =>
                setProperties([...properties, { key: '', value: '' }])
              }
              className="text-xs font-semibold text-accent flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> add
            </button>
          }
        >
          <KeyValueEditor pairs={properties} onChange={setProperties} />
        </Panel>
      </div>

      {/* SCRIPT column */}
      <div className="space-y-3">
        <Panel
          title={
            <span className="flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5" /> Script
            </span>
          }
          actions={
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                fn:
              </span>
              <input
                value={fnName}
                onChange={(e) => setFnName(e.target.value)}
                className="input py-1 px-2 text-xs font-mono w-32"
                spellCheck={false}
              />
              <CopyButton value={script} />
            </div>
          }
        >
          <CodeArea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder={
              language === 'groovy'
                ? '// Write or paste your Groovy script here...'
                : '// Write or paste your JavaScript here...'
            }
            className="h-[55vh]"
          />
        </Panel>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleRun} className="btn-primary">
            <Play className="w-3.5 h-3.5" /> Run Script
          </button>
          <button onClick={handleClear} className="btn-ghost">
            <Eraser className="w-3.5 h-3.5" /> Clear output
          </button>
        </div>
        <Panel
          title={
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Console
              {consoleLog.length > 0 && (
                <span className="text-[11px] normal-case font-normal text-slate-500 dark:text-slate-400">
                  {consoleLog.length} entries
                </span>
              )}
            </span>
          }
        >
          {consoleLog.length === 0 ? (
            <div className="code-area text-slate-500 dark:text-slate-400">
              // Logs from script execution will appear here...
            </div>
          ) : (
            <pre className="code-area whitespace-pre-wrap break-words p-2 max-h-56 overflow-auto rounded-md bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-700/60">
              {consoleLog.map((c, i) => (
                <div
                  key={i}
                  className={
                    c.level === 'error'
                      ? 'text-rose-500'
                      : c.level === 'warn'
                        ? 'text-amber-500'
                        : c.level === 'info'
                          ? 'text-sky-500'
                          : 'text-slate-700 dark:text-slate-200'
                  }
                >
                  <span className="opacity-60 mr-2">
                    [{c.level.toUpperCase()}]
                  </span>
                  {c.text}
                </div>
              ))}
            </pre>
          )}
          {error && (
            <div className="mt-2">
              <ErrorBanner message={error} />
            </div>
          )}
        </Panel>
      </div>

      {/* OUTPUT column */}
      <OutputColumns state={output} />
    </div>
  );
}

function NavigateAway({ label, id }: { label: string; id: string }) {
  return (
    <div className="panel p-8 text-center">
      <div className="text-slate-500 dark:text-slate-400 mb-3">
        Open the dedicated{' '}
        <span className="font-semibold text-accent">{label}</span> tool from the
        sidebar for the full editor.
      </div>
      <div className="text-xs text-slate-400">
        Tool id: <code className="font-mono">{id}</code>
      </div>
    </div>
  );
}
