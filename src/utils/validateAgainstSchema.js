import { get, isNullish } from "./objectPath.js";
import { coerceToInteger } from "./coerce.js";

export function validateAndCoerce(data, schema) {
  const patched = structuredClone(data || {});
  const missing = [];
  const errors  = [];

  for (const f of schema) {
    const { key, type, required, integer } = f;
    const val = get(patched, key);

    // Coercitions nombre entier si demandé
    if (type === 'number') {
      const coerced = coerceToInteger(val);
      if (integer) {
        if (coerced === null) {
          if (required) missing.push(key);
        } else {
          // garde l'entier strict
          const v = Math.trunc(coerced);
          setByPath(patched, key, v);
        }
      } else {
        if (coerced !== null) setByPath(patched, key, coerced);
        else if (required) missing.push(key);
      }
      continue;
    }

    // list<string>
    if (type === 'list<string>') {
      const ok = Array.isArray(val) && val.every(x => typeof x === 'string' && x.trim() !== '');
      if (!ok && required) missing.push(key);
      continue;
    }

    // date
    if (type === 'date') {
      const ok = typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);
      if (!ok && required) missing.push(key);
      continue;
    }

    // text / autres
    if (required && isNullish(val)) missing.push(key);
  }

  return { patched, missing, errors };
}

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  parts.forEach((k, i) => {
    if (i === parts.length - 1) cur[k] = value;
    else { cur[k] ??= {}; cur = cur[k]; }
  });
}
