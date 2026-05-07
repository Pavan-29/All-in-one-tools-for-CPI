// Lightweight XML → XSD generator.
// Produces a Russian-doll style schema (one nested complexType per element).
// Targeted at the common shapes seen in SAP CPI payloads (no namespaces,
// repeating siblings collapsed, attributes captured, simple type inference).

import { DOMParser } from '@xmldom/xmldom';

interface NodeShape {
  name: string;
  // For each child element name we record the shape, max occurrence and ordered position.
  children: Map<string, { shape: NodeShape; maxCount: number; order: number }>;
  attributes: Map<string, Set<string>>; // name → samples
  textSamples: Set<string>;
  hasMixedContent: boolean;
  occurrences: number;
  occurrenceCount: Map<string, number>; // children-occurrences in this exact element instance
}

function newShape(name: string): NodeShape {
  return {
    name,
    children: new Map(),
    attributes: new Map(),
    textSamples: new Set(),
    hasMixedContent: false,
    occurrences: 0,
    occurrenceCount: new Map(),
  };
}

function isNumeric(s: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(s.trim());
}
function isInteger(s: string): boolean {
  return /^-?\d+$/.test(s.trim());
}
function isBoolean(s: string): boolean {
  return /^(true|false|0|1)$/i.test(s.trim());
}
function isDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}
function isDateTime(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s.trim());
}

function inferType(samples: Iterable<string>): string {
  const arr = Array.from(samples).filter((v) => v.length > 0);
  if (!arr.length) return 'xs:string';
  if (arr.every(isInteger)) return 'xs:integer';
  if (arr.every(isNumeric)) return 'xs:decimal';
  if (arr.every(isBoolean)) return 'xs:boolean';
  if (arr.every(isDateTime)) return 'xs:dateTime';
  if (arr.every(isDate)) return 'xs:date';
  return 'xs:string';
}

function mergeShape(target: NodeShape, source: NodeShape): NodeShape {
  target.occurrences += source.occurrences;
  for (const [k, v] of source.attributes) {
    const existing = target.attributes.get(k);
    if (existing) {
      v.forEach((x) => existing.add(x));
    } else {
      target.attributes.set(k, new Set(v));
    }
  }
  for (const t of source.textSamples) target.textSamples.add(t);
  if (source.hasMixedContent) target.hasMixedContent = true;
  for (const [name, info] of source.children) {
    const existing = target.children.get(name);
    if (existing) {
      existing.shape = mergeShape(existing.shape, info.shape);
      existing.maxCount = Math.max(existing.maxCount, info.maxCount);
    } else {
      target.children.set(name, {
        shape: info.shape,
        maxCount: info.maxCount,
        order: target.children.size,
      });
    }
  }
  return target;
}

function buildShape(el: Element): NodeShape {
  const shape = newShape(el.localName || el.nodeName);
  shape.occurrences = 1;
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes.item(i)!;
    if (attr.name.startsWith('xmlns')) continue;
    if (!shape.attributes.has(attr.name)) shape.attributes.set(attr.name, new Set());
    shape.attributes.get(attr.name)!.add(attr.value);
  }
  // Track per-instance child counts for maxOccurs detection
  const counts = new Map<string, number>();
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes.item(i);
    if (node.nodeType === 1 /* element */) {
      const child = node as Element;
      const childShape = buildShape(child);
      counts.set(child.nodeName, (counts.get(child.nodeName) ?? 0) + 1);
      const existing = shape.children.get(child.nodeName);
      if (existing) {
        mergeShape(existing.shape, childShape);
      } else {
        shape.children.set(child.nodeName, {
          shape: childShape,
          maxCount: 1,
          order: shape.children.size,
        });
      }
    } else if (node.nodeType === 3 /* text */) {
      const txt = (node.nodeValue ?? '').trim();
      if (txt) {
        shape.textSamples.add(txt);
      }
    }
  }
  // Update maxCount for children seen multiple times in this instance
  for (const [name, count] of counts) {
    const info = shape.children.get(name);
    if (info && count > info.maxCount) info.maxCount = count;
  }
  // Mixed content: there are both child elements and non-empty text
  if (shape.children.size > 0 && shape.textSamples.size > 0)
    shape.hasMixedContent = true;
  return shape;
}

function indent(level: number) {
  return '  '.repeat(level);
}

function emitShape(shape: NodeShape, level: number, isRoot: boolean): string {
  const out: string[] = [];
  const tag = isRoot ? `xs:element name="${shape.name}"` : `xs:element name="${shape.name}"`;
  // Determine cardinality information is the parent's responsibility.
  const childOnly = shape.children.size > 0;
  const hasAttributes = shape.attributes.size > 0;
  const hasText = shape.textSamples.size > 0;
  const isComplex = childOnly || hasAttributes;

  if (!isComplex) {
    const type = inferType(shape.textSamples);
    out.push(`${indent(level)}<${tag} type="${type}"/>`);
    return out.join('\n');
  }

  out.push(`${indent(level)}<${tag}>`);
  out.push(`${indent(level + 1)}<xs:complexType${shape.hasMixedContent ? ' mixed="true"' : ''}>`);

  if (childOnly) {
    out.push(`${indent(level + 2)}<xs:sequence>`);
    const children = Array.from(shape.children.values()).sort(
      (a, b) => a.order - b.order
    );
    for (const c of children) {
      const childXsd = emitShape(c.shape, level + 3, false);
      // We need to insert minOccurs/maxOccurs on the element itself.
      const occursAttr = c.maxCount > 1 ? ' minOccurs="0" maxOccurs="unbounded"' : ' minOccurs="0"';
      // Patch the first <xs:element ...> opening tag to include the occurs attribute.
      const patched = childXsd.replace(
        /<xs:element name="([^"]+)"([^>]*)/,
        (_m, n, rest) => `<xs:element name="${n}"${rest}${occursAttr}`
      );
      out.push(patched);
    }
    out.push(`${indent(level + 2)}</xs:sequence>`);
  } else if (hasText) {
    // simpleContent extension
    const baseType = inferType(shape.textSamples);
    out[out.length - 1] = `${indent(level + 1)}<xs:complexType>`;
    out.push(`${indent(level + 2)}<xs:simpleContent>`);
    out.push(`${indent(level + 3)}<xs:extension base="${baseType}">`);
    for (const [aname, samples] of shape.attributes) {
      const atype = inferType(samples);
      out.push(`${indent(level + 4)}<xs:attribute name="${aname}" type="${atype}"/>`);
    }
    out.push(`${indent(level + 3)}</xs:extension>`);
    out.push(`${indent(level + 2)}</xs:simpleContent>`);
    out.push(`${indent(level + 1)}</xs:complexType>`);
    out.push(`${indent(level)}</xs:element>`);
    return out.join('\n');
  }

  // Attributes — only when complexType has children (otherwise handled above)
  if (hasAttributes && childOnly) {
    for (const [aname, samples] of shape.attributes) {
      const atype = inferType(samples);
      out.push(`${indent(level + 2)}<xs:attribute name="${aname}" type="${atype}"/>`);
    }
  }
  out.push(`${indent(level + 1)}</xs:complexType>`);
  out.push(`${indent(level)}</xs:element>`);
  return out.join('\n');
}

export function generateXsd(xml: string): string {
  const doc = new DOMParser({
    errorHandler: {
      warning: () => {},
      error: (e) => {
        throw new Error(typeof e === 'string' ? e : 'XML parse error');
      },
      fatalError: (e) => {
        throw new Error(typeof e === 'string' ? e : 'XML parse error');
      },
    },
  }).parseFromString(xml, 'text/xml');
  const root = doc.documentElement;
  if (!root) throw new Error('No root element found');
  const shape = buildShape(root);
  const body = emitShape(shape, 1, true);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">',
    body,
    '</xs:schema>',
  ].join('\n');
}
