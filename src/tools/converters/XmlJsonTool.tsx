import { useState } from 'react';
import { ArrowRight, Eraser, Sparkles } from 'lucide-react';
import { XMLParser } from 'fast-xml-parser';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';

export default function XmlJsonTool() {
  const [xml, setXml] = useState('');
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Options
  const [keepAttributes, setKeepAttributes] = useState(true);
  const [attrPrefix, setAttrPrefix] = useState('@_');
  const [textNodeName, setTextNodeName] = useState('#text');
  const [parseValues, setParseValues] = useState(false);
  const [indent, setIndent] = useState(2);

  const convert = () => {
    try {
      const parser = new XMLParser({
        ignoreAttributes: !keepAttributes,
        attributeNamePrefix: attrPrefix,
        textNodeName,
        parseTagValue: parseValues,
        parseAttributeValue: parseValues,
        trimValues: true,
        preserveOrder: false,
      });
      const obj = parser.parse(xml);
      setJson(JSON.stringify(obj, null, indent));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const clear = () => {
    setXml('');
    setJson('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="panel p-3 grid sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Attribute prefix
          <input
            value={attrPrefix}
            onChange={(e) => setAttrPrefix(e.target.value)}
            className="input py-1.5 font-mono"
            disabled={!keepAttributes}
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
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          JSON indent
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            className="select py-1.5"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={0}>minified</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mt-5">
          <input
            type="checkbox"
            checked={keepAttributes}
            onChange={(e) => setKeepAttributes(e.target.checked)}
            className="accent-accent"
          />
          Keep XML attributes
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mt-5">
          <input
            type="checkbox"
            checked={parseValues}
            onChange={(e) => setParseValues(e.target.checked)}
            className="accent-accent"
          />
          Parse number/bool values
        </label>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="XML Input" actions={<CopyButton value={xml} />}>
          <CodeArea
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            placeholder='<root>\n  <item id="1">value</item>\n</root>'
            className="h-[55vh]"
          />
        </Panel>
        <Panel title="JSON Output" actions={<CopyButton value={json} />}>
          <CodeArea
            value={json}
            readOnly
            placeholder="JSON output appears here..."
            className="h-[55vh]"
          />
        </Panel>
      </div>

      <div className="flex justify-center gap-2">
        <button onClick={convert} className="btn-primary">
          <ArrowRight className="w-4 h-4" /> Convert XML → JSON
        </button>
        <button onClick={clear} className="btn-ghost">
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}
