export function formatJson(json: string, indent = 2): string {
  if (!json.trim()) return '';
  const parsed = JSON.parse(json);
  return JSON.stringify(parsed, null, indent);
}

export function minifyJson(json: string): string {
  if (!json.trim()) return '';
  return JSON.stringify(JSON.parse(json));
}

export function tryParseJson<T = unknown>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function jsonValidate(json: string): { ok: true } | { ok: false; error: string } {
  try {
    JSON.parse(json);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
