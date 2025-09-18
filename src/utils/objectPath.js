export const get = (obj, path) => path.split('.').reduce((o,k)=> (o?.[k]), obj);
export const set = (obj, path, value) => {
  const parts = path.split('.'); let cur = obj;
  parts.forEach((k, i) => {
    if (i === parts.length - 1) { cur[k] = value; return; }
    cur[k] ??= {}; cur = cur[k];
  });
  return obj;
};
export const flatten = (obj, prefix = '', out = {}) => {
  Object.entries(obj || {}).forEach(([k, v]) => {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out);
    else out[p] = v;
  });
  return out;
};
export const unflatten = (flat) => {
  const out = {};
  Object.entries(flat || {}).forEach(([path, value]) => set(out, path, value));
  return out;
};
export const isNullish = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
