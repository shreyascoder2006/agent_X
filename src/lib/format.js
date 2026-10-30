// Formatting helpers. Money uses Indian digit grouping (₹10,00,000) and a true minus sign.

const NF = [0, 1, 2].map(
  (d) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }),
);

export const MINUS = '−';

/** Seconds since midnight. */
export const T = (h, m = 0, s = 0) => h * 3600 + m * 60 + s;
export const OPEN = T(9, 15);
export const CLOSE = T(15, 30);

export function inr(x, dp = 0, sign = false) {
  if (x == null || Number.isNaN(x)) return '—';
  const v = Math.abs(x) < 0.005 ? 0 : x;
  const prefix = v < 0 ? MINUS : sign && v > 0 ? '+' : '';
  return `${prefix}₹${NF[dp].format(Math.abs(v))}`;
}

export const num = (x, dp = 0) => NF[dp].format(x);
export const fmtP = (x) => NF[2].format(x);

export function pct(x, dp = 2, sign = true) {
  if (x == null || Number.isNaN(x)) return '—';
  const v = x * 100;
  const r = Math.abs(v).toFixed(dp);
  if (Number(r) === 0) return `${r}%`;
  return `${v < 0 ? MINUS : sign ? '+' : ''}${r}%`;
}

/** ₹16.85 L style, for axes and compact tiles. */
export const lakh = (v, dp = 2) => `₹${(v / 1e5).toFixed(dp)}L`;

export const pad2 = (n) => String(n).padStart(2, '0');

export function hms(x) {
  const s = Math.max(0, Math.floor(x));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}
export const hm = (x) => hms(x).slice(0, 5);

export function mmss(x) {
  const s = Math.max(0, Math.round(x));
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
}

export const rStr = (R) => `${R < 0 ? MINUS : '+'}${Math.abs(R).toFixed(2)}R`;
export const signed = (x, dp = 2) => `${x < 0 ? MINUS : '+'}${Math.abs(x).toFixed(dp)}`;

/** Agent loop number (1–25): one loop every 15 minutes from 09:15. */
export const loopNo = (t) => (t < OPEN ? 0 : Math.min(25, Math.floor((t - OPEN) / 900) + 1));

export const marketStatus = (t) => (t < OPEN ? 'PRE-OPEN' : t <= CLOSE ? 'OPEN' : 'CLOSED');

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
