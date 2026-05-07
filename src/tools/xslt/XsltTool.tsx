import { useState } from 'react';
import { Play, FileCode2, Eraser } from 'lucide-react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import ErrorBanner from '../../components/common/ErrorBanner';
import { useToast } from '../../contexts/ToastContext';

const SAMPLE_XML = `<?xml version="1.0"?>
<orders>
  <order id="A1">
    <customer>Alice</customer>
    <total>49.99</total>
  </order>
  <order id="A2">
    <customer>Bob</customer>
    <total>120.00</total>
  </order>
</orders>`;

const SAMPLE_XSLT = `<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes"/>
  <xsl:template match="/">
    <Receipts>
      <xsl:for-each select="orders/order">
        <Receipt orderId="{@id}">
          <Buyer><xsl:value-of select="customer"/></Buyer>
          <Amount><xsl:value-of select="total"/></Amount>
        </Receipt>
      </xsl:for-each>
    </Receipts>
  </xsl:template>
</xsl:stylesheet>`;

export default function XsltTool() {
  const [xml, setXml] = useState(SAMPLE_XML);
  const [xslt, setXslt] = useState(SAMPLE_XSLT);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRun = () => {
    try {
      // The browser ships with a native XSLT 1.0 processor; we use it.
      if (typeof XSLTProcessor === 'undefined') {
        throw new Error(
          'This browser does not expose the native XSLTProcessor.'
        );
      }
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'application/xml');
      const xsltDoc = parser.parseFromString(xslt, 'application/xml');

      // Surface XML / XSLT parse errors clearly.
      const xmlErr = xmlDoc.getElementsByTagName('parsererror')[0];
      if (xmlErr) throw new Error('XML parse error: ' + xmlErr.textContent);
      const xsltErr = xsltDoc.getElementsByTagName('parsererror')[0];
      if (xsltErr) throw new Error('XSLT parse error: ' + xsltErr.textContent);

      const proc = new XSLTProcessor();
      proc.importStylesheet(xsltDoc);
      const resultDoc = proc.transformToDocument(xmlDoc);
      // Prefer xs:output method but fall back to serializing XML
      const serializer = new XMLSerializer();
      const text = serializer.serializeToString(resultDoc);
      setOutput(text);
      setError(null);
      toast('Transformation complete', 'success');
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  };

  const handleClear = () => {
    setXml('');
    setXslt('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="panel p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <FileCode2 className="w-4 h-4 text-accent" /> Runs XSLT 1.0 transformations entirely in your browser.
      </div>
      <div className="grid xl:grid-cols-3 gap-4">
        <Panel title="Source XML" actions={<CopyButton value={xml} />}>
          <CodeArea
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            placeholder="Source XML payload..."
            className="h-[60vh]"
          />
        </Panel>
        <Panel title="XSLT stylesheet" actions={<CopyButton value={xslt} />}>
          <CodeArea
            value={xslt}
            onChange={(e) => setXslt(e.target.value)}
            placeholder="<xsl:stylesheet>..."
            className="h-[60vh]"
          />
        </Panel>
        <Panel title="Output" actions={<CopyButton value={output} />}>
          <CodeArea
            value={output}
            readOnly
            placeholder="Transformation output appears here..."
            className="h-[60vh]"
          />
        </Panel>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="flex justify-center gap-2">
        <button onClick={handleRun} className="btn-primary">
          <Play className="w-4 h-4" /> Run transformation
        </button>
        <button onClick={handleClear} className="btn-ghost">
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}
