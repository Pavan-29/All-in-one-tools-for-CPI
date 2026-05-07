import { useState } from 'react';
import { ArrowRight, Eraser } from 'lucide-react';
import { XMLBuilder } from 'fast-xml-parser';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';

export default function JsonXmlTool() {
  const [json, setJson] = useState('');
  const [xml, setXml] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [attrPrefix, setAttrPrefix] = useState('@_');
  const [textNodeName, setTextNodeName] = useState('#text');
  const [indent, setIndent] = useState('  ');
  const [pretty, setPretty] = useState(true);
  const [includeDecl, setIncludeDecl] = useState(true);
  const [rootName, setRootName] = useState('root');

  const convert = () => {
    try {
      const data = JSON.parse(json);
      const builder = new XMLBuilder({
        attributeNamePrefix: attrPrefix,
        textNodeName,
        ignoreAttributes: false,
        format: pretty,
        indentBy: indent,
        suppressEmptyNode: false,
      });

      // If parsed JSON has a single root key, build directly. Otherwise wrap with rootName.
      let toBuild = data;
      if (
        typeof data !== 'object' ||
        Array.isArray(data) ||
        Object.keys(data).length !== 1
      ) {
        toBuild = { [rootName]: data };
      }
      const body = builder.build(toBuild);
      const decl = includeDecl ? '<?xml version="1.0" encoding="UTF-8"?>\n' : '';
      setXml(decl + body);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const clear = () => {
    setJson('');
    setXml('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="panel p-3 grid sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Root name (when needed)
          <input
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            className="input py-1.5 font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Attribute prefix
          <input
            value={attrPrefix}
            onChange={(e) => setAttrPrefix(e.target.value)}
            className="input py-1.5 font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Text-node name
          <input
            value={textNodeName}
            onChange={(e) => setTextNodeName(e.target.value)}
            className="input py-1.5 font-mono"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mt-5">
          <input
            type="checkbox"
            checked={pretty}
            onChange={(e) => setPretty(e.target.checked)}
            className="accent-accent"
          />
          Pretty print
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mt-5">
          <input
            type="checkbox"
            checked={includeDecl}
            onChange={(e) => setIncludeDecl(e.target.checked)}
            className="accent-accent"
          />
          Include &lt;?xml ...?&gt; declaration
        </label>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="JSON Input" actions={<CopyButton value={json} />}>
          <CodeArea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='{"root": {"item": [{"@_id":"1", "#text":"value"}]}}'
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
          <ArrowRight className="w-4 h-4" /> Convert JSON → XML
        </button>
        <button onClick={clear} className="btn-ghost">
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}
