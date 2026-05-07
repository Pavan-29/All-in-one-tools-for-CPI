import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

const PARSE_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: false,
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
};

const BUILD_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: false,
};

export function parseXml(xml: string): unknown {
  const parser = new XMLParser(PARSE_OPTS);
  return parser.parse(xml);
}

export function buildXml(obj: unknown): string {
  const builder = new XMLBuilder(BUILD_OPTS);
  return builder.build(obj);
}

export function validateXml(xml: string): { ok: true } | { ok: false; error: string } {
  const result = XMLValidator.validate(xml, {
    allowBooleanAttributes: true,
  });
  if (result === true) return { ok: true };
  const e = result.err;
  return {
    ok: false,
    error: `${e.code}: ${e.msg} (line ${e.line}, col ${e.col})`,
  };
}

/**
 * Format XML using a streaming text approach (preserves CDATA, comments, etc.)
 * indent: number of spaces to indent
 */
export function formatXml(xml: string, indent = 2): string {
  const trimmed = xml.trim();
  if (!trimmed) return '';
  const PADDING = ' '.repeat(indent);
  let formatted = '';
  let pad = 0;
  // Split between tags
  const tokens = trimmed
    .replace(/(>)(<)(\/*)/g, '$1\n$2$3')
    .split('\n');
  for (const token of tokens) {
    if (!token.trim()) continue;
    let indentDelta = 0;
    if (/^<\/[^>]+>$/.test(token)) {
      // closing tag
      pad = Math.max(pad - 1, 0);
    } else if (/^<[^!?][^>]*[^/]>$/.test(token) && !/^<[^>]+\/>$/.test(token)) {
      // opening tag, but not self-closing
      indentDelta = 1;
    } else if (/^<\?xml/.test(token) || /^<!--/.test(token) || /^<!DOCTYPE/.test(token) || /^<!\[CDATA/.test(token) || /^<[^>]+\/>$/.test(token)) {
      // declarations, comments, self-closing — no indent change
    } else if (/<\/[^>]+>$/.test(token) && /^<[^/!?]/.test(token)) {
      // single line element <a>val</a> — no indent change
    } else if (/^<[^/!?][^>]*>$/.test(token)) {
      indentDelta = 1;
    }
    formatted += PADDING.repeat(pad) + token + '\n';
    pad += indentDelta;
  }
  return formatted.trim();
}

export function minifyXml(xml: string): string {
  return xml
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
