import { useEffect, useState } from 'react';
import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';

const ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
type Algo = (typeof ALGORITHMS)[number];

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Pure-JS MD5 implementation (Web Crypto does not support MD5)
function md5(str: string): string {
  // Adapted from RFC 1321 reference. Compact public-domain implementation.
  function L(k: number, d: number) {
    const I = (k & 0xffff) + (d & 0xffff);
    const J = (k >> 16) + (d >> 16) + (I >> 16);
    return (J << 16) | (I & 0xffff);
  }
  function R(d: number, _: number) {
    return (d << _) | (d >>> (32 - _));
  }
  function C(d: number, _: number, k: number, l: number, m: number, n: number) {
    return L(R(L(L(_, d), L(l, n)), m), k);
  }
  function F(d: number, _: number, k: number, l: number, m: number, n: number, o: number) {
    return C((_ & k) | (~_ & l), d, _, m, n, o);
  }
  function G(d: number, _: number, k: number, l: number, m: number, n: number, o: number) {
    return C((_ & l) | (k & ~l), d, _, m, n, o);
  }
  function H(d: number, _: number, k: number, l: number, m: number, n: number, o: number) {
    return C(_ ^ k ^ l, d, _, m, n, o);
  }
  function I(d: number, _: number, k: number, l: number, m: number, n: number, o: number) {
    return C(k ^ (_ | ~l), d, _, m, n, o);
  }
  function toUtf8(str: string): number[] {
    const utf8 = unescape(encodeURIComponent(str));
    const out = [];
    for (let i = 0; i < utf8.length; i++) out.push(utf8.charCodeAt(i));
    return out;
  }
  const bytes = toUtf8(str);
  const len = bytes.length;
  const x: number[] = [];
  for (let i = 0; i < len; i++) x[i >> 2] = (x[i >> 2] || 0) | (bytes[i] << ((i % 4) * 8));
  x[len >> 2] = (x[len >> 2] || 0) | (0x80 << ((len % 4) * 8));
  x[(((len + 8) >> 6) << 4) + 14] = len * 8;
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;
  for (let i = 0; i < x.length; i += 16) {
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;
    a = F(a, b, c, d, x[i] | 0, 7, -680876936);
    d = F(d, a, b, c, x[i + 1] | 0, 12, -389564586);
    c = F(c, d, a, b, x[i + 2] | 0, 17, 606105819);
    b = F(b, c, d, a, x[i + 3] | 0, 22, -1044525330);
    a = F(a, b, c, d, x[i + 4] | 0, 7, -176418897);
    d = F(d, a, b, c, x[i + 5] | 0, 12, 1200080426);
    c = F(c, d, a, b, x[i + 6] | 0, 17, -1473231341);
    b = F(b, c, d, a, x[i + 7] | 0, 22, -45705983);
    a = F(a, b, c, d, x[i + 8] | 0, 7, 1770035416);
    d = F(d, a, b, c, x[i + 9] | 0, 12, -1958414417);
    c = F(c, d, a, b, x[i + 10] | 0, 17, -42063);
    b = F(b, c, d, a, x[i + 11] | 0, 22, -1990404162);
    a = F(a, b, c, d, x[i + 12] | 0, 7, 1804603682);
    d = F(d, a, b, c, x[i + 13] | 0, 12, -40341101);
    c = F(c, d, a, b, x[i + 14] | 0, 17, -1502002290);
    b = F(b, c, d, a, x[i + 15] | 0, 22, 1236535329);
    a = G(a, b, c, d, x[i + 1] | 0, 5, -165796510);
    d = G(d, a, b, c, x[i + 6] | 0, 9, -1069501632);
    c = G(c, d, a, b, x[i + 11] | 0, 14, 643717713);
    b = G(b, c, d, a, x[i] | 0, 20, -373897302);
    a = G(a, b, c, d, x[i + 5] | 0, 5, -701558691);
    d = G(d, a, b, c, x[i + 10] | 0, 9, 38016083);
    c = G(c, d, a, b, x[i + 15] | 0, 14, -660478335);
    b = G(b, c, d, a, x[i + 4] | 0, 20, -405537848);
    a = G(a, b, c, d, x[i + 9] | 0, 5, 568446438);
    d = G(d, a, b, c, x[i + 14] | 0, 9, -1019803690);
    c = G(c, d, a, b, x[i + 3] | 0, 14, -187363961);
    b = G(b, c, d, a, x[i + 8] | 0, 20, 1163531501);
    a = G(a, b, c, d, x[i + 13] | 0, 5, -1444681467);
    d = G(d, a, b, c, x[i + 2] | 0, 9, -51403784);
    c = G(c, d, a, b, x[i + 7] | 0, 14, 1735328473);
    b = G(b, c, d, a, x[i + 12] | 0, 20, -1926607734);
    a = H(a, b, c, d, x[i + 5] | 0, 4, -378558);
    d = H(d, a, b, c, x[i + 8] | 0, 11, -2022574463);
    c = H(c, d, a, b, x[i + 11] | 0, 16, 1839030562);
    b = H(b, c, d, a, x[i + 14] | 0, 23, -35309556);
    a = H(a, b, c, d, x[i + 1] | 0, 4, -1530992060);
    d = H(d, a, b, c, x[i + 4] | 0, 11, 1272893353);
    c = H(c, d, a, b, x[i + 7] | 0, 16, -155497632);
    b = H(b, c, d, a, x[i + 10] | 0, 23, -1094730640);
    a = H(a, b, c, d, x[i + 13] | 0, 4, 681279174);
    d = H(d, a, b, c, x[i] | 0, 11, -358537222);
    c = H(c, d, a, b, x[i + 3] | 0, 16, -722521979);
    b = H(b, c, d, a, x[i + 6] | 0, 23, 76029189);
    a = H(a, b, c, d, x[i + 9] | 0, 4, -640364487);
    d = H(d, a, b, c, x[i + 12] | 0, 11, -421815835);
    c = H(c, d, a, b, x[i + 15] | 0, 16, 530742520);
    b = H(b, c, d, a, x[i + 2] | 0, 23, -995338651);
    a = I(a, b, c, d, x[i] | 0, 6, -198630844);
    d = I(d, a, b, c, x[i + 7] | 0, 10, 1126891415);
    c = I(c, d, a, b, x[i + 14] | 0, 15, -1416354905);
    b = I(b, c, d, a, x[i + 5] | 0, 21, -57434055);
    a = I(a, b, c, d, x[i + 12] | 0, 6, 1700485571);
    d = I(d, a, b, c, x[i + 3] | 0, 10, -1894986606);
    c = I(c, d, a, b, x[i + 10] | 0, 15, -1051523);
    b = I(b, c, d, a, x[i + 1] | 0, 21, -2054922799);
    a = I(a, b, c, d, x[i + 8] | 0, 6, 1873313359);
    d = I(d, a, b, c, x[i + 15] | 0, 10, -30611744);
    c = I(c, d, a, b, x[i + 6] | 0, 15, -1560198380);
    b = I(b, c, d, a, x[i + 13] | 0, 21, 1309151649);
    a = I(a, b, c, d, x[i + 4] | 0, 6, -145523070);
    d = I(d, a, b, c, x[i + 11] | 0, 10, -1120210379);
    c = I(c, d, a, b, x[i + 2] | 0, 15, 718787259);
    b = I(b, c, d, a, x[i + 9] | 0, 21, -343485551);
    a = L(a, oa);
    b = L(b, ob);
    c = L(c, oc);
    d = L(d, od);
  }
  function rh(n: number) {
    let s = '';
    for (let i = 0; i < 4; i++)
      s += ((n >> (i * 8 + 4)) & 0x0f).toString(16) + ((n >> (i * 8)) & 0x0f).toString(16);
    return s;
  }
  return rh(a) + rh(b) + rh(c) + rh(d);
}

async function digest(algo: Algo, input: string): Promise<string> {
  if (algo === 'MD5') return md5(input);
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest(algo, data);
  return bufferToHex(buf);
}

export default function HashTool() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Record<Algo, string>>({
    MD5: '',
    'SHA-1': '',
    'SHA-256': '',
    'SHA-384': '',
    'SHA-512': '',
  });

  useEffect(() => {
    let cancelled = false;
    if (!input) {
      setHashes({ MD5: '', 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
      return;
    }
    (async () => {
      const out = {} as Record<Algo, string>;
      for (const a of ALGORITHMS) out[a] = await digest(a, input);
      if (!cancelled) setHashes(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [input]);

  return (
    <div className="space-y-4">
      <Panel title="Input">
        <CodeArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste content to hash..."
          className="h-40"
        />
      </Panel>
      <Panel title="Hashes (hex)">
        <div className="grid gap-2">
          {ALGORITHMS.map((a) => (
            <div key={a} className="flex items-center gap-2">
              <span className="w-20 text-xs font-bold text-accent">{a}</span>
              <input
                value={hashes[a]}
                readOnly
                className="input py-1 px-2 text-xs font-mono"
              />
              <CopyButton value={hashes[a]} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
