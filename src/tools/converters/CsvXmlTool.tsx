import { useState } from 'react';
import Papa from 'papaparse';
import { ArrowRight, Eraser } from 'lucide-react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';

export default function CsvXmlTool() {
  const [csv, setCsv] = useState('');
  const [xml, setXml] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [rootName, setRootName] = useState('Records');
  const [recordName, setRecordName] = useState('Record');
  const [includeDecl, setIncludeDecl] = useState(true);
  const [indent, setIndent] = useState('  ');

  const sanitizeTag = (raw: string, idx: number): string => {
    const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z_]/, '_');
    return cleaned || `Column${idx + 1}`;
  };

  const escapeXml = (s: string): string =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const convert = () => {
    try {
      const parsed = Papa.parse(csv.trim(), {
        delimiter: delimiter === '\\t' ? '\t' : delimiter,
        skipEmptyLines: true,
      });
      const rows = parsed.data as string[][];
      if (!rows.length) throw new Error('No CSV rows found');

      const header = hasHeader
        ? rows[0].map((h, i) => sanitizeTag(h.trim(), i))
        : rows[0].map((_, i) => `Column${i + 1}`);

      const data = hasHeader ? rows.slice(1) : rows;
      const lines: string[] = [];
      if (includeDecl) lines.push('<?xml version="1.0" encoding="UTF-8"?>');
      lines.push(`<${rootName}>`);
      for (const row of data) {
        lines.push(`${indent}<${recordName}>`);
        for (let i = 0; i < header.length; i++) {
          const tag = header[i];
          const value = row[i] ?? '';
          lines.push(`${indent}${indent}<${tag}>${escapeXml(value)}</${tag}>`);
        }
        lines.push(`${indent}</${recordName}>`);
      }
      lines.push(`</${rootName}>`);
      setXml(lines.join('\n'));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const clear = () => {
    setCsv('');
    setXml('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="panel p-3 grid sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Root element
          <input
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            className="input py-1.5 font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Record element
          <input
            value={recordName}
            onChange={(e) => setRecordName(e.target.value)}
            className="input py-1.5 font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Delimiter
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="select py-1.5"
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="|">Pipe (|)</option>
            <option value="\t">Tab</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mt-5">
          <input
            type="checkbox"
            checked={hasHeader}
            onChange={(e) => setHasHeader(e.target.checked)}
            className="accent-accent"
          />
          First row is header
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mt-5">
          <input
            type="checkbox"
            checked={includeDecl}
            onChange={(e) => setIncludeDecl(e.target.checked)}
            className="accent-accent"
          />
          Include &lt;?xml ...?&gt;
        </label>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="CSV Input" actions={<CopyButton value={csv} />}>
          <CodeArea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={`id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com`}
            className="h-[55vh]"
          />
        </Panel>
        <Panel title="XML Output" actions={<CopyButton value={xml} />}>
          <CodeArea
            value={xml}
            readOnly
            placeholder="XML output appears here..."
            className="h-[55vh]"
          />
        </Panel>
      </div>

      <div className="flex justify-center gap-2">
        <button onClick={convert} className="btn-primary">
          <ArrowRight className="w-4 h-4" /> Convert CSV → XML
        </button>
        <button onClick={clear} className="btn-ghost">
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}
