import { useState } from 'react';
import { ArrowRight, Eraser, Download } from 'lucide-react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';
import { generateXsd } from '../../utils/xsdGen';
import { downloadText } from '../../utils/clipboard';

export default function XsdTool() {
  const [xml, setXml] = useState('');
  const [xsd, setXsd] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    try {
      const out = generateXsd(xml);
      setXsd(out);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel p-3 text-xs text-slate-500 dark:text-slate-400">
        Generates a Russian-doll style XSD schema from a sample XML payload.
        Type inference covers <code>xs:integer</code>, <code>xs:decimal</code>,{' '}
        <code>xs:boolean</code>, <code>xs:date</code>, <code>xs:dateTime</code> and{' '}
        <code>xs:string</code>. Repeating siblings are collapsed into{' '}
        <code>maxOccurs="unbounded"</code>.
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="XML sample" actions={<CopyButton value={xml} />}>
          <CodeArea
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            placeholder={`<Order id="1001">\n  <Customer>Alice</Customer>\n  <Item qty="2">A</Item>\n  <Item qty="1">B</Item>\n  <Total>49.99</Total>\n</Order>`}
            className="h-[60vh]"
          />
        </Panel>
        <Panel
          title="XSD output"
          actions={
            <>
              <CopyButton value={xsd} />
              <button
                onClick={() =>
                  xsd && downloadText('schema.xsd', xsd, 'application/xml')
                }
                className="icon-btn"
                title="Download .xsd"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          }
        >
          <CodeArea
            value={xsd}
            readOnly
            placeholder="Generated XSD will appear here..."
            className="h-[60vh]"
          />
        </Panel>
      </div>
      <div className="flex justify-center">
        <button onClick={handleGenerate} className="btn-primary">
          <ArrowRight className="w-4 h-4" /> Generate XSD
        </button>
        <button
          onClick={() => {
            setXml('');
            setXsd('');
            setError(null);
          }}
          className="btn-ghost ml-2"
        >
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}
