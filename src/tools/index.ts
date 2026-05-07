import { ComponentType } from 'react';
import {
  GitCompareArrows,
  Braces,
  FileCode2,
  ArrowRightLeft,
  Sheet,
  FileType2,
  Crosshair,
  Wand2,
  Workflow,
  ListTree,
  Lock,
  Link2,
  Hash,
  KeyRound,
  Clock,
  Hexagon,
  Regex,
  ShieldCheck,
  CheckCircle2,
  Fingerprint,
  TextSelect,
  type LucideIcon,
} from 'lucide-react';

// Lazy import each tool — keeps the bundle tree-shake-friendly.
import TextDiffTool from './text-diff/TextDiffTool';
import FormatterTool from './formatter/FormatterTool';
import XmlJsonTool from './converters/XmlJsonTool';
import JsonXmlTool from './converters/JsonXmlTool';
import CsvXmlTool from './converters/CsvXmlTool';
import XsdTool from './xsd/XsdTool';
import XPathTool from './xpath/XPathTool';
import GroovyTool from './groovy/GroovyTool';
import XsltTool from './xslt/XsltTool';
import ValueMappingTool from './valuemap/ValueMappingTool';
import Base64Tool from './utility/Base64Tool';
import UrlEncoderTool from './utility/UrlEncoderTool';
import HashTool from './utility/HashTool';
import JwtTool from './utility/JwtTool';
import UuidTool from './utility/UuidTool';
import TimestampTool from './utility/TimestampTool';
import RegexTool from './utility/RegexTool';
import JsonSchemaTool from './validators/JsonSchemaTool';
import CertDecoderTool from './security/CertDecoderTool';
import EncryptionTool from './security/EncryptionTool';
import CaseConverterTool from './utility/CaseConverterTool';

export interface ToolGroup {
  id: string;
  label: string;
  tools: ToolDef[];
}

export interface ToolDef {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  component: ComponentType;
  badge?: string;
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'compare',
    label: 'Compare & Format',
    tools: [
      {
        id: 'text-diff',
        name: 'Text / Payload Diff',
        shortLabel: 'Text Diff',
        description: 'Compare two XML / JSON / text payloads side-by-side.',
        icon: GitCompareArrows,
        component: TextDiffTool,
      },
      {
        id: 'formatter',
        name: 'Format JSON & XML',
        shortLabel: 'Formatter',
        description: 'Pretty-print, minify and validate JSON or XML payloads.',
        icon: Braces,
        component: FormatterTool,
      },
    ],
  },
  {
    id: 'converters',
    label: 'Converters',
    tools: [
      {
        id: 'xml-json',
        name: 'XML → JSON',
        shortLabel: 'XML → JSON',
        description: 'Convert XML to JSON (preserves attributes & namespaces).',
        icon: ArrowRightLeft,
        component: XmlJsonTool,
      },
      {
        id: 'json-xml',
        name: 'JSON → XML',
        shortLabel: 'JSON → XML',
        description: 'Convert JSON back to well-formed XML.',
        icon: ArrowRightLeft,
        component: JsonXmlTool,
      },
      {
        id: 'csv-xml',
        name: 'CSV → XML',
        shortLabel: 'CSV → XML',
        description: 'Generate XML from CSV rows with configurable record name.',
        icon: Sheet,
        component: CsvXmlTool,
      },
    ],
  },
  {
    id: 'xml-schema',
    label: 'XML Schema & Mapping',
    tools: [
      {
        id: 'xsd',
        name: 'XML → XSD Generator',
        shortLabel: 'XSD',
        description: 'Auto-generate an XSD schema from an XML payload.',
        icon: FileType2,
        component: XsdTool,
      },
      {
        id: 'xpath',
        name: 'XPath Evaluator',
        shortLabel: 'XPath',
        description: 'Evaluate XPath 1.0 expressions against an XML document.',
        icon: Crosshair,
        component: XPathTool,
      },
      {
        id: 'xslt',
        name: 'XSLT Mapping',
        shortLabel: 'XSLT',
        description: 'Run XSLT 1.0 transformations on XML payloads.',
        icon: Workflow,
        component: XsltTool,
      },
      {
        id: 'value-mapping',
        name: 'Value Mapping',
        shortLabel: 'Value Mapping',
        description: 'Lookup values across SAP CPI value-mapping agencies.',
        icon: ListTree,
        component: ValueMappingTool,
      },
    ],
  },
  {
    id: 'cpi-runtime',
    label: 'CPI Runtime',
    tools: [
      {
        id: 'groovy',
        name: 'Groovy Script Simulator',
        shortLabel: 'Groovy',
        description:
          'Run CPI-style Groovy/JS scripts with a simulated Message API.',
        icon: Wand2,
        component: GroovyTool,
        badge: 'CPI',
      },
    ],
  },
  {
    id: 'utilities',
    label: 'Utilities',
    tools: [
      {
        id: 'base64',
        name: 'Base64',
        shortLabel: 'Base64',
        description: 'Encode and decode Base64 strings.',
        icon: FileCode2,
        component: Base64Tool,
      },
      {
        id: 'url-encoder',
        name: 'URL Encoder',
        shortLabel: 'URL',
        description: 'Encode and decode URL components and query strings.',
        icon: Link2,
        component: UrlEncoderTool,
      },
      {
        id: 'hash',
        name: 'Hash Generator',
        shortLabel: 'Hash',
        description: 'Generate MD5, SHA-1, SHA-256, SHA-512 hashes.',
        icon: Hash,
        component: HashTool,
      },
      {
        id: 'jwt',
        name: 'JWT Decoder',
        shortLabel: 'JWT',
        description: 'Decode and inspect JSON Web Tokens.',
        icon: KeyRound,
        component: JwtTool,
      },
      {
        id: 'uuid',
        name: 'UUID Generator',
        shortLabel: 'UUID',
        description: 'Generate v4 / v7 UUIDs and validate existing ones.',
        icon: Hexagon,
        component: UuidTool,
      },
      {
        id: 'timestamp',
        name: 'Timestamp Converter',
        shortLabel: 'Time',
        description: 'Convert between epoch, ISO 8601 and human time.',
        icon: Clock,
        component: TimestampTool,
      },
      {
        id: 'regex',
        name: 'Regex Tester',
        shortLabel: 'Regex',
        description: 'Test regular expressions with live highlighting.',
        icon: Regex,
        component: RegexTool,
      },
      {
        id: 'case',
        name: 'Case Converter',
        shortLabel: 'Case',
        description:
          'Convert between camelCase, snake_case, PascalCase, kebab-case…',
        icon: TextSelect,
        component: CaseConverterTool,
      },
    ],
  },
  {
    id: 'validation',
    label: 'Validation',
    tools: [
      {
        id: 'json-schema',
        name: 'JSON Schema Validator',
        shortLabel: 'JSON Schema',
        description: 'Validate JSON instances against a JSON Schema.',
        icon: CheckCircle2,
        component: JsonSchemaTool,
      },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    tools: [
      {
        id: 'cert-decoder',
        name: 'Certificate Decoder',
        shortLabel: 'Cert Decoder',
        description: 'Decode PEM / Base64-encoded X.509 certificates.',
        icon: Fingerprint,
        component: CertDecoderTool,
      },
      {
        id: 'encryption',
        name: 'AES Encryption Playground',
        shortLabel: 'AES',
        description: 'Encrypt and decrypt with AES-GCM / AES-CBC.',
        icon: Lock,
        component: EncryptionTool,
        badge: 'WebCrypto',
      },
    ],
  },
];

export const ALL_TOOLS: ToolDef[] = TOOL_GROUPS.flatMap((g) => g.tools);

export function findTool(id: string): ToolDef | undefined {
  return ALL_TOOLS.find((t) => t.id === id);
}
