import { useState } from 'react';
import { Play, Eraser, ShieldCheck } from 'lucide-react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';
import { validateAgainstSchema } from '../../utils/jsonSchemaValidate';
import { useToast } from '../../contexts/ToastContext';

const SAMPLE_SCHEMA = JSON.stringify(
  {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    required: ['orderId', 'customer', 'items'],
    properties: {
      orderId: { type: 'string', pattern: '^A[0-9]+$' },
      customer: {
        type: 'object',
        required: ['email'],
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
        },
      },
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['sku', 'qty'],
          properties: {
            sku: { type: 'string' },
            qty: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
  },
  null,
  2
);

const SAMPLE_DATA = JSON.stringify(
  {
    orderId: 'A101',
    customer: { name: 'Alice', email: 'alice@example.com' },
    items: [{ sku: 'X-1', qty: 2 }],
  },
  null,
  2
);

export default function JsonSchemaTool() {
  const [schemaText, setSchemaText] = useState(SAMPLE_SCHEMA);
  const [dataText, setDataText] = useState(SAMPLE_DATA);
  const [result, setResult] = useState<{
    valid: boolean;
    errors: { path: string; message: string }[];
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleValidate = () => {
    setParseError(null);
    let schema, data;
    try {
      schema = JSON.parse(schemaText);
    } catch (e) {
      setParseError('Schema: ' + (e as Error).message);
      return;
    }
    try {
      data = JSON.parse(dataText);
    } catch (e) {
      setParseError('Data: ' + (e as Error).message);
      return;
    }
    const errors = validateAgainstSchema(data, schema);
    setResult({ valid: errors.length === 0, errors });
    toast(errors.length === 0 ? 'Valid ✓' : `${errors.length} validation errors`, errors.length === 0 ? 'success' : 'error');
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="JSON Schema" actions={<CopyButton value={schemaText} />}>
          <CodeArea
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            placeholder='{"type":"object",...}'
            className="h-[55vh]"
          />
        </Panel>
        <Panel title="Instance" actions={<CopyButton value={dataText} />}>
          <CodeArea
            value={dataText}
            onChange={(e) => setDataText(e.target.value)}
            placeholder='{"orderId":"A101",...}'
            className="h-[55vh]"
          />
        </Panel>
      </div>
      {parseError && <ErrorBanner message={parseError} />}
      <div className="flex justify-center gap-2">
        <button onClick={handleValidate} className="btn-primary">
          <Play className="w-4 h-4" /> Validate
        </button>
        <button
          onClick={() => {
            setSchemaText('');
            setDataText('');
            setResult(null);
            setParseError(null);
          }}
          className="btn-ghost"
        >
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
      {result && (
        <Panel
          title={
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Result —{' '}
              <span
                className={
                  result.valid ? 'text-emerald-500' : 'text-rose-500'
                }
              >
                {result.valid ? 'Valid' : `${result.errors.length} error(s)`}
              </span>
            </span>
          }
        >
          {result.valid ? (
            <div className="text-sm text-emerald-700 dark:text-emerald-300">
              Instance conforms to the schema. 🎉
            </div>
          ) : (
            <div className="overflow-auto max-h-72 rounded-md border border-rose-500/30">
              <table className="w-full text-xs code-area">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-900/60">
                  <tr>
                    <th className="text-left px-2 py-1.5 w-1/3">Path</th>
                    <th className="text-left px-2 py-1.5">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr
                      key={i}
                      className="border-t border-slate-200 dark:border-navy-700/60"
                    >
                      <td className="px-2 py-1 text-rose-500 font-mono">
                        {e.path || '(root)'}
                      </td>
                      <td className="px-2 py-1">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
