// Backtest analytics over the generated monthly series.
import { MONTHS, SERIES } from './backtestData.js';

export const STRATS = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'trend', label: 'Trend-EMA' },
  { id: 'rsi2', label: 'RSI-2' },
  { id: 'breakout', label: 'Breakout' },
];

// Month index where each range starts (index 0 = Dec 2021 close = start of 2022).
export const RANGES = [
  { id: '1Y', label: '1Y', from: 36, span: '2025' },
  { id: '2Y', label: '2Y', from: 24, span: '2024–2025' },
  { id: '3Y', label: '3Y', from: 12, span: '2023–2025' },
  { id: 'ALL', label: 'All', from: 0, span: 'Jan 2022–Dec 2025' },
];

/** Trade-level stats come from the trade log, not the monthly curve. */
export const TRADE_STATS = {
  portfolio: { trades: 212, winRate: 0.542, avgR: 0.31, profitFactor: 1.62 },
  trend: { trades: 86, winRate: 0.477, avgR: 0.42, profitFactor: 1.71 },
  rsi2: { trades: 74, winRate: 0.649, avgR: 0.18, profitFactor: 1.49 },
  breakout: { trades: 52, winRate: 0.5, avgR: 0.29, profitFactor: 1.44 },
};

const RF_MONTHLY = 0.065 / 12;

/** Rebased slice of a strategy series and buy-and-hold, in ₹ lakh. */
export function getSeries(strategy, rangeId) {
  const r = RANGES.find((x) => x.id === rangeId) || RANGES[3];
  const s = SERIES[strategy].slice(r.from);
  const b = SERIES.bh.slice(r.from);
  const s0 = s[0];
  const b0 = b[0];
  return MONTHS.slice(r.from).map((m, i) => ({
    m,
    niyam: (s[i] / s0) * 10,
    bh: (b[i] / b0) * 10,
  }));
}

export function stats(eq) {
  const r = [];
  for (let i = 1; i < eq.length; i++) r.push(eq[i] / eq[i - 1] - 1);
  const n = r.length;
  const cagr = (eq[eq.length - 1] / eq[0]) ** (12 / n) - 1;
  let peak = eq[0];
  let mdd = 0;
  for (const v of eq) {
    peak = Math.max(peak, v);
    mdd = Math.min(mdd, v / peak - 1);
  }
  const mean = r.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(r.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const sharpe = ((mean - RF_MONTHLY) / sd) * Math.sqrt(12);
  const vol = sd * Math.sqrt(12);
  return { end: eq[eq.length - 1], cagr, mdd, sharpe, vol, posMonths: r.filter((x) => x > 0).length / n };
}

export function drawdowns(rows) {
  let pn = rows[0].niyam;
  let pb = rows[0].bh;
  return rows.map((row) => {
    pn = Math.max(pn, row.niyam);
    pb = Math.max(pb, row.bh);
    return { m: row.m, niyam: (row.niyam / pn - 1) * 100, bh: (row.bh / pb - 1) * 100 };
  });
}

/** Monthly returns grid for the heatmap: { year: [12 months] }. */
export function monthlyGrid(strategy) {
  const s = SERIES[strategy];
  const out = {};
  for (let i = 1; i < s.length; i++) {
    const year = 2022 + Math.floor((i - 1) / 12);
    (out[year] ||= []).push(s[i] / s[i - 1] - 1);
  }
  return out;
}

export const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
