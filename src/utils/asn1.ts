// Minimal ASN.1 / DER walker that extracts the most useful fields out of an
// X.509 certificate without pulling in heavy crypto libraries.
// We deliberately avoid full parsing — just enough to display Subject, Issuer,
// Serial, Validity, Signature alg, Public-key bit length and key fingerprint.

interface ASN1Node {
  tag: number;
  length: number;
  contents: Uint8Array; // raw contents
  children?: ASN1Node[]; // when constructed
}

function parse(bytes: Uint8Array, offset = 0): { node: ASN1Node; nextOffset: number } {
  const tag = bytes[offset++];
  let length = bytes[offset++];
  if (length & 0x80) {
    const numBytes = length & 0x7f;
    length = 0;
    for (let i = 0; i < numBytes; i++) length = (length << 8) | bytes[offset++];
  }
  const contents = bytes.slice(offset, offset + length);
  const next = offset + length;
  const node: ASN1Node = { tag, length, contents };
  if (tag & 0x20) {
    // constructed
    node.children = [];
    let pos = 0;
    while (pos < contents.length) {
      const sub = parse(contents, pos);
      node.children.push(sub.node);
      pos = sub.nextOffset;
    }
  }
  return { node, nextOffset: next };
}

function pemToDer(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

const OID_TABLE: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.9': 'STREET',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '1.2.840.113549.1.9.1': 'emailAddress',
  '1.2.840.113549.1.1.1': 'rsaEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
  '1.2.840.10045.2.1': 'ecPublicKey',
  '2.5.29.17': 'subjectAltName',
  '2.5.29.19': 'basicConstraints',
  '2.5.29.15': 'keyUsage',
  '2.5.29.37': 'extKeyUsage',
};

function decodeOid(bytes: Uint8Array): string {
  const out: number[] = [];
  out.push(Math.floor(bytes[0] / 40));
  out.push(bytes[0] % 40);
  let value = 0;
  for (let i = 1; i < bytes.length; i++) {
    value = (value << 7) | (bytes[i] & 0x7f);
    if (!(bytes[i] & 0x80)) {
      out.push(value);
      value = 0;
    }
  }
  return out.join('.');
}

function decodeName(seq: ASN1Node): string {
  // RDNSequence — sequence of sets of attribute-value pairs
  const parts: string[] = [];
  for (const rdn of seq.children ?? []) {
    for (const attr of rdn.children ?? []) {
      const oidNode = attr.children?.[0];
      const valueNode = attr.children?.[1];
      if (!oidNode || !valueNode) continue;
      const oid = decodeOid(oidNode.contents);
      const friendly = OID_TABLE[oid] ?? oid;
      const value = new TextDecoder().decode(valueNode.contents);
      parts.push(`${friendly}=${value}`);
    }
  }
  return parts.join(', ');
}

function asn1Time(node: ASN1Node): Date | null {
  const s = new TextDecoder().decode(node.contents);
  // UTCTime YYMMDDhhmmssZ ; GeneralizedTime YYYYMMDDhhmmssZ
  let yyyy: string;
  let rest: string;
  if (s.length === 13) {
    const yy = parseInt(s.slice(0, 2), 10);
    yyyy = String((yy < 50 ? 2000 + yy : 1900 + yy)).padStart(4, '0');
    rest = s.slice(2);
  } else if (s.length >= 14) {
    yyyy = s.slice(0, 4);
    rest = s.slice(4);
  } else return null;
  const mm = rest.slice(0, 2),
    dd = rest.slice(2, 4),
    hh = rest.slice(4, 6),
    mi = rest.slice(6, 8),
    ss = rest.slice(8, 10);
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}Z`);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':');
}

export interface CertSummary {
  version: number;
  serialNumber: string;
  signatureAlgorithm: string;
  issuer: string;
  subject: string;
  notBefore?: string;
  notAfter?: string;
  isExpired?: boolean;
  publicKeyAlgorithm: string;
  publicKeyBits?: number;
  fingerprintSha256?: string;
}

export async function decodeCertificate(pemOrDer: string): Promise<CertSummary> {
  const trimmed = pemOrDer.trim();
  let der: Uint8Array;
  if (trimmed.includes('BEGIN ')) {
    der = pemToDer(trimmed);
  } else {
    // assume base64
    const binary = atob(trimmed.replace(/\s+/g, ''));
    der = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) der[i] = binary.charCodeAt(i);
  }
  const root = parse(der).node;
  if (!root.children?.length) throw new Error('Invalid DER (no children)');
  const tbs = root.children[0];
  const sigAlg = root.children[1];

  // tbsCertificate fields
  const tbsChildren = tbs.children ?? [];
  let i = 0;
  let version = 1;
  if (tbsChildren[0]?.tag === 0xa0) {
    const inner = tbsChildren[0].children?.[0];
    if (inner) version = inner.contents[0] + 1;
    i++;
  }
  const serial = tbsChildren[i++];
  i++; // signature alg (in tbs)
  const issuer = tbsChildren[i++];
  const validity = tbsChildren[i++];
  const subject = tbsChildren[i++];
  const subjectPKInfo = tbsChildren[i++];

  const notBefore = validity?.children?.[0] ? asn1Time(validity.children[0]) : null;
  const notAfter = validity?.children?.[1] ? asn1Time(validity.children[1]) : null;
  const sigAlgOid = sigAlg?.children?.[0] ? decodeOid(sigAlg.children[0].contents) : '';
  const pkAlgOid =
    subjectPKInfo?.children?.[0]?.children?.[0]
      ? decodeOid(subjectPKInfo.children[0].children[0].contents)
      : '';

  // RSA modulus → bit length
  let pkBits: number | undefined;
  try {
    const bitString = subjectPKInfo?.children?.[1];
    if (bitString) {
      const inner = parse(bitString.contents.slice(1)).node;
      const modulus = inner.children?.[0];
      if (modulus) {
        // strip leading zero
        let leading = 0;
        while (modulus.contents[leading] === 0) leading++;
        pkBits = (modulus.contents.length - leading) * 8;
      }
    }
  } catch {
    /* ignore */
  }

  // SHA-256 fingerprint of full DER
  let fingerprint: string | undefined;
  try {
    const hashBuf = await crypto.subtle.digest('SHA-256', der as BufferSource);
    fingerprint = bytesToHex(new Uint8Array(hashBuf));
  } catch {
    /* ignore */
  }

  return {
    version,
    serialNumber: bytesToHex(serial?.contents ?? new Uint8Array()),
    signatureAlgorithm: OID_TABLE[sigAlgOid] ?? sigAlgOid,
    issuer: issuer ? decodeName(issuer) : '',
    subject: subject ? decodeName(subject) : '',
    notBefore: notBefore?.toISOString(),
    notAfter: notAfter?.toISOString(),
    isExpired: notAfter ? notAfter.getTime() < Date.now() : undefined,
    publicKeyAlgorithm: OID_TABLE[pkAlgOid] ?? pkAlgOid,
    publicKeyBits: pkBits,
    fingerprintSha256: fingerprint,
  };
}
