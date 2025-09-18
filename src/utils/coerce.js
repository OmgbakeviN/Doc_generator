export function coerceToInteger(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[, ]/g, ''));
    return Number.isFinite(n) ? Math.trunc(n) : null; // ✅ entiers
  }
  