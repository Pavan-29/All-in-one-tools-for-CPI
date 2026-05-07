// Tiny JSON Schema validator (Draft-07-ish, the parts most CPI devs need).
// Supports: type, required, properties, additionalProperties, items, enum,
// const, minLength, maxLength, pattern, minimum, maximum, exclusiveMinimum,
// exclusiveMaximum, minItems, maxItems, uniqueItems, anyOf, oneOf, allOf, not,
// $ref (local — #/definitions/x or #/$defs/x).

interface ValidationError {
  path: string;
  message: string;
}

type Schema = any;

function typeOf(v: any): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function getRef(root: Schema, ref: string): Schema | null {
  if (!ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let cur: any = root;
  for (const p of parts) {
    if (cur == null) return null;
    cur = cur[decodeURIComponent(p)];
  }
  return cur ?? null;
}

function isValidType(value: any, type: string | string[]): boolean {
  if (Array.isArray(type)) return type.some((t) => isValidType(value, t));
  const actual = typeOf(value);
  if (type === 'integer') return actual === 'number' && Number.isInteger(value);
  if (type === 'number') return actual === 'number';
  return actual === type;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a == null || b == null) return false;
  if (typeof a !== 'object') return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => deepEqual(a[k], b[k]));
}

function validate(
  data: any,
  schema: Schema,
  root: Schema,
  path: string,
  errors: ValidationError[]
) {
  if (schema == null || typeof schema !== 'object') return;

  if (schema.$ref) {
    const sub = getRef(root, schema.$ref);
    if (sub) validate(data, sub, root, path, errors);
    else errors.push({ path, message: `Cannot resolve $ref ${schema.$ref}` });
    return;
  }

  if (schema.type) {
    if (!isValidType(data, schema.type)) {
      errors.push({
        path,
        message: `Expected type ${
          Array.isArray(schema.type) ? schema.type.join(' or ') : schema.type
        }, got ${typeOf(data)}`,
      });
    }
  }

  if (schema.enum && !schema.enum.some((e: any) => deepEqual(e, data))) {
    errors.push({
      path,
      message: `Value must be one of ${JSON.stringify(schema.enum)}`,
    });
  }

  if (schema.const !== undefined && !deepEqual(data, schema.const)) {
    errors.push({
      path,
      message: `Value must equal ${JSON.stringify(schema.const)}`,
    });
  }

  // string
  if (typeof data === 'string') {
    if (schema.minLength != null && data.length < schema.minLength) {
      errors.push({ path, message: `String shorter than minLength ${schema.minLength}` });
    }
    if (schema.maxLength != null && data.length > schema.maxLength) {
      errors.push({ path, message: `String longer than maxLength ${schema.maxLength}` });
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
      errors.push({ path, message: `String does not match pattern ${schema.pattern}` });
    }
    if (schema.format) {
      const ok = checkFormat(data, schema.format);
      if (!ok) errors.push({ path, message: `String does not match format ${schema.format}` });
    }
  }

  // number
  if (typeof data === 'number') {
    if (schema.minimum != null && data < schema.minimum)
      errors.push({ path, message: `Value less than minimum ${schema.minimum}` });
    if (schema.maximum != null && data > schema.maximum)
      errors.push({ path, message: `Value greater than maximum ${schema.maximum}` });
    if (schema.exclusiveMinimum != null && data <= schema.exclusiveMinimum)
      errors.push({ path, message: `Value not greater than ${schema.exclusiveMinimum}` });
    if (schema.exclusiveMaximum != null && data >= schema.exclusiveMaximum)
      errors.push({ path, message: `Value not less than ${schema.exclusiveMaximum}` });
    if (schema.multipleOf != null && data % schema.multipleOf !== 0)
      errors.push({ path, message: `Value not a multiple of ${schema.multipleOf}` });
  }

  // array
  if (Array.isArray(data)) {
    if (schema.minItems != null && data.length < schema.minItems)
      errors.push({ path, message: `Array has fewer than ${schema.minItems} items` });
    if (schema.maxItems != null && data.length > schema.maxItems)
      errors.push({ path, message: `Array has more than ${schema.maxItems} items` });
    if (schema.uniqueItems) {
      const seen: any[] = [];
      for (const item of data) {
        if (seen.some((s) => deepEqual(s, item))) {
          errors.push({ path, message: 'Array items must be unique' });
          break;
        }
        seen.push(item);
      }
    }
    if (schema.items) {
      data.forEach((item, i) => {
        const sub = Array.isArray(schema.items) ? schema.items[i] : schema.items;
        if (sub) validate(item, sub, root, `${path}[${i}]`, errors);
      });
    }
  }

  // object
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (schema.required) {
      for (const key of schema.required as string[]) {
        if (!(key in data))
          errors.push({ path, message: `Missing required property "${key}"` });
      }
    }
    if (schema.properties) {
      for (const [k, sub] of Object.entries(schema.properties as Record<string, Schema>)) {
        if (k in data) validate(data[k], sub, root, path ? `${path}.${k}` : k, errors);
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      const allowed = new Set(Object.keys(schema.properties));
      for (const k of Object.keys(data)) {
        if (!allowed.has(k))
          errors.push({ path, message: `Additional property "${k}" not allowed` });
      }
    }
  }

  // combinators
  if (schema.allOf) {
    for (const sub of schema.allOf) validate(data, sub, root, path, errors);
  }
  if (schema.anyOf) {
    const tries = schema.anyOf.map((sub: Schema) => {
      const sub_errors: ValidationError[] = [];
      validate(data, sub, root, path, sub_errors);
      return sub_errors;
    });
    if (tries.every((errs: ValidationError[]) => errs.length > 0)) {
      errors.push({ path, message: `Value does not match any of anyOf` });
    }
  }
  if (schema.oneOf) {
    const matched = schema.oneOf.filter((sub: Schema) => {
      const sub_errors: ValidationError[] = [];
      validate(data, sub, root, path, sub_errors);
      return sub_errors.length === 0;
    });
    if (matched.length !== 1) {
      errors.push({
        path,
        message: `Value must match exactly one schema in oneOf (matched ${matched.length})`,
      });
    }
  }
  if (schema.not) {
    const subErrors: ValidationError[] = [];
    validate(data, schema.not, root, path, subErrors);
    if (subErrors.length === 0) {
      errors.push({ path, message: 'Value matches schema in "not"' });
    }
  }
}

function checkFormat(value: string, format: string): boolean {
  switch (format) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'uri':
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'uuid':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(value);
    case 'date-time':
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
    case 'ipv4':
      return /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
    default:
      return true;
  }
}

export function validateAgainstSchema(
  data: any,
  schema: Schema
): ValidationError[] {
  const errors: ValidationError[] = [];
  validate(data, schema, schema, '', errors);
  return errors;
}
