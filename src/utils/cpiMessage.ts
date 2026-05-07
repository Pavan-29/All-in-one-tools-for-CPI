// In-browser simulation of SAP CPI's Message class.
// Mirrors the public surface used in 99% of CPI Groovy scripts:
//   getBody / setBody / getHeaders / setHeaders / setHeader / getHeader
//   getProperties / setProperties / setProperty / getProperty
//   getAttachments / addAttachmentAsString
//   addLogProperty / setHeader (custom message processing log)

export interface CpiAttachment {
  name: string;
  value: string;
  type?: string;
}

export interface CpiLogEntry {
  name: string;
  value: string;
  type?: string;
}

export interface CpiMessageState {
  body: any;
  headers: Record<string, string>;
  properties: Record<string, string>;
  attachments: CpiAttachment[];
  logProperties: CpiLogEntry[];
  customHeaderProperties: Record<string, string>;
  consoleLog: string[];
}

export class Message {
  state: CpiMessageState;

  constructor(initial?: Partial<CpiMessageState>) {
    this.state = {
      body: initial?.body ?? '',
      headers: { ...(initial?.headers ?? {}) },
      properties: { ...(initial?.properties ?? {}) },
      attachments: [...(initial?.attachments ?? [])],
      logProperties: [...(initial?.logProperties ?? [])],
      customHeaderProperties: { ...(initial?.customHeaderProperties ?? {}) },
      consoleLog: initial?.consoleLog ?? [],
    };
  }

  // Body
  getBody(_type?: any): any {
    return this.state.body;
  }
  setBody(body: any): void {
    this.state.body = body;
  }

  // Headers
  getHeaders(): Record<string, string> {
    return this.state.headers;
  }
  setHeaders(headers: Record<string, string>): void {
    this.state.headers = { ...headers };
  }
  getHeader(name: string, _type?: any): string | undefined {
    return this.state.headers[name];
  }
  setHeader(name: string, value: any): void {
    this.state.headers[name] = String(value);
  }
  removeHeader(name: string): void {
    delete this.state.headers[name];
  }

  // Properties
  getProperties(): Record<string, string> {
    return this.state.properties;
  }
  setProperties(props: Record<string, string>): void {
    this.state.properties = { ...props };
  }
  getProperty(name: string): string | undefined {
    return this.state.properties[name];
  }
  setProperty(name: string, value: any): void {
    this.state.properties[name] = String(value);
  }
  removeProperty(name: string): void {
    delete this.state.properties[name];
  }

  // Attachments
  getAttachments(): CpiAttachment[] {
    return this.state.attachments;
  }
  addAttachmentAsString(name: string, value: string, type = 'text/plain'): void {
    this.state.attachments.push({ name, value, type });
  }

  // Logging extensions used in CPI's monitor
  addLogProperty(name: string, value: any, type = 'string'): void {
    this.state.logProperties.push({ name, value: String(value), type });
  }
  setCustomHeaderProperty(name: string, value: any): void {
    this.state.customHeaderProperties[name] = String(value);
  }

  // Wibey/CPI bonus helpers — frequently re-used utilities in scripts
  static fromJson(json: string): any {
    return JSON.parse(json);
  }
  static toJson(obj: any, pretty = false): string {
    return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  }
}

// JsonSlurper / JsonOutput — Groovy classes commonly used in CPI scripts
export const JsonSlurper = class {
  parseText(text: string) {
    return JSON.parse(text);
  }
  parse(input: string) {
    return JSON.parse(input);
  }
};
export const JsonOutput = {
  toJson(obj: any) {
    return JSON.stringify(obj);
  },
  prettyPrint(json: string | any) {
    return JSON.stringify(typeof json === 'string' ? JSON.parse(json) : json, null, 2);
  },
};

// XmlSlurper-style helper backed by fast-xml-parser
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
export const XmlSlurper = class {
  parseText(text: string) {
    return new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      textNodeName: '#text',
      trimValues: true,
    }).parse(text);
  }
};
export const XmlBuilderHelper = class {
  build(obj: any, pretty = true) {
    return new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      textNodeName: '#text',
      format: pretty,
      indentBy: '  ',
    }).build(obj);
  }
};
