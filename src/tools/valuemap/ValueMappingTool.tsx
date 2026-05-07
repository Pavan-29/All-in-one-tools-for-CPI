import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowRight,
  Save,
  Upload,
  Download,
  Search,
} from 'lucide-react';
import Panel from '../../components/common/Panel';
import CopyButton from '../../components/common/CopyButton';
import { useToast } from '../../contexts/ToastContext';
import { downloadText } from '../../utils/clipboard';

interface VMRow {
  sourceAgency: string;
  sourceIdentifier: string;
  sourceValue: string;
  targetAgency: string;
  targetIdentifier: string;
  targetValue: string;
}

const STORAGE_KEY = 'cpi-toolkit:value-mapping';

const INITIAL: VMRow[] = [
  {
    sourceAgency: 'SAP',
    sourceIdentifier: 'Country',
    sourceValue: 'IN',
    targetAgency: 'ISO',
    targetIdentifier: 'Country',
    targetValue: 'IND',
  },
  {
    sourceAgency: 'SAP',
    sourceIdentifier: 'Country',
    sourceValue: 'US',
    targetAgency: 'ISO',
    targetIdentifier: 'Country',
    targetValue: 'USA',
  },
];

export default function ValueMappingTool() {
  const [rows, setRows] = useState<VMRow[]>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        /* ignore */
      }
    }
    return INITIAL;
  });
  const [filter, setFilter] = useState('');

  // Lookup form
  const [srcAgency, setSrcAgency] = useState('');
  const [srcId, setSrcId] = useState('');
  const [srcValue, setSrcValue] = useState('');
  const [tgtAgency, setTgtAgency] = useState('');
  const [tgtId, setTgtId] = useState('');
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!filter.trim()) return rows;
    const f = filter.toLowerCase();
    return rows.filter((r) =>
      Object.values(r).some((v) => v.toLowerCase().includes(f))
    );
  }, [rows, filter]);

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        sourceAgency: '',
        sourceIdentifier: '',
        sourceValue: '',
        targetAgency: '',
        targetIdentifier: '',
        targetValue: '',
      },
    ]);

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const updateRow = (index: number, key: keyof VMRow, value: string) =>
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r))
    );

  const handleLookup = () => {
    const match = rows.find(
      (r) =>
        (!srcAgency || r.sourceAgency === srcAgency) &&
        (!srcId || r.sourceIdentifier === srcId) &&
        r.sourceValue === srcValue &&
        (!tgtAgency || r.targetAgency === tgtAgency) &&
        (!tgtId || r.targetIdentifier === tgtId)
    );
    if (match) {
      setLookupResult(match.targetValue);
      toast(`Found: ${match.targetValue}`, 'success');
    } else {
      setLookupResult(null);
      toast('No matching value-mapping entry', 'error');
    }
  };

  const handleExport = () => {
    downloadText(
      'value-mapping.json',
      JSON.stringify(rows, null, 2),
      'application/json'
    );
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(String(e.target?.result ?? '[]'));
        if (Array.isArray(data)) {
          setRows(data);
          toast(`Imported ${data.length} entries`, 'success');
        }
      } catch {
        toast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <Panel title="Lookup">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2 items-end">
          <Field label="Source agency" value={srcAgency} onChange={setSrcAgency} />
          <Field label="Source ID" value={srcId} onChange={setSrcId} />
          <Field label="Source value *" value={srcValue} onChange={setSrcValue} />
          <Field label="Target agency" value={tgtAgency} onChange={setTgtAgency} />
          <Field label="Target ID" value={tgtId} onChange={setTgtId} />
          <button onClick={handleLookup} className="btn-primary">
            <ArrowRight className="w-3.5 h-3.5" /> Lookup
          </button>
        </div>
        {lookupResult !== null && (
          <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-mono text-emerald-700 dark:text-emerald-300">
            Mapped value: <strong>{lookupResult}</strong>
            <CopyButton value={lookupResult} />
          </div>
        )}
      </Panel>

      <Panel
        title={
          <span>
            Mapping table
            <span className="ml-2 text-[11px] normal-case font-normal text-slate-500 dark:text-slate-400">
              {rows.length} entries · saved locally
            </span>
          </span>
        }
        actions={
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter…"
                className="input pl-7 py-1 text-xs"
              />
            </div>
            <button onClick={addRow} className="btn-secondary !py-1 !px-2 text-xs">
              <Plus className="w-3 h-3" /> Add
            </button>
            <label className="btn-secondary !py-1 !px-2 text-xs cursor-pointer">
              <Upload className="w-3 h-3" /> Import
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                }}
              />
            </label>
            <button onClick={handleExport} className="btn-secondary !py-1 !px-2 text-xs">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        }
      >
        <div className="overflow-auto max-h-[55vh] rounded-md border border-slate-200 dark:border-navy-700/60">
          <table className="w-full text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-900/60 sticky top-0">
              <tr>
                <th className="text-left px-2 py-1.5">Src Agency</th>
                <th className="text-left px-2 py-1.5">Src ID</th>
                <th className="text-left px-2 py-1.5">Src Value</th>
                <th className="text-left px-2 py-1.5">Tgt Agency</th>
                <th className="text-left px-2 py-1.5">Tgt ID</th>
                <th className="text-left px-2 py-1.5">Tgt Value</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => {
                const realIndex = rows.indexOf(row);
                return (
                  <tr
                    key={realIndex}
                    className="border-t border-slate-200 dark:border-navy-700/60 hover:bg-slate-50 dark:hover:bg-navy-900/30"
                  >
                    {(
                      [
                        'sourceAgency',
                        'sourceIdentifier',
                        'sourceValue',
                        'targetAgency',
                        'targetIdentifier',
                        'targetValue',
                      ] as Array<keyof VMRow>
                    ).map((k) => (
                      <td key={k} className="px-1 py-0.5">
                        <input
                          value={row[k]}
                          onChange={(e) => updateRow(realIndex, k, e.target.value)}
                          className="input py-0.5 px-1.5 text-xs font-mono"
                        />
                      </td>
                    ))}
                    <td className="px-1">
                      <button
                        onClick={() => removeRow(realIndex)}
                        className="text-rose-500 px-1.5"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input py-1.5 font-mono"
      />
    </label>
  );
}
