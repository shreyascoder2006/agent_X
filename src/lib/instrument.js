// Instrument helpers for the drawer, watchlist and heatmap: illustrative index weights,
// a depth ladder around the sim price, and paper charges on fills.
import { UNIVERSE } from '../data/universe.js';
import { rng, tick05 } from './random.js';

/** Illustrative NIFTY 50 weights (%), used to size heatmap cells. */
const W = {
  HDFCBANK: 12.9, ICICIBANK: 8.6, RELIANCE: 8.3, INFY: 5.1, BHARTIARTL: 4.6, LT: 3.8, ITC: 3.4, TCS: 3.3, AXISBANK: 3.0,
  SBIN: 2.9, KOTAKBANK: 2.7, 'M&M': 2.5, BAJFINANCE: 2.2, HINDUNILVR: 2.0, HCLTECH: 1.8, SUNPHARMA: 1.7, MARUTI: 1.6,
  NTPC: 1.5, TITAN: 1.4, ETERNAL: 1.4, ULTRACEMCO: 1.3, POWERGRID: 1.3, TRENT: 1.2, TATASTEEL: 1.2, BEL: 1.2,
  ASIANPAINT: 1.0, BAJAJFINSV: 1.0, JSWSTEEL: 0.9, ADANIPORTS: 0.9, HINDALCO: 0.9, TECHM: 0.9, GRASIM: 0.8, ONGC: 0.8,
  COALINDIA: 0.8, SHRIRAMFIN: 0.8, NESTLEIND: 0.7, CIPLA: 0.7, SBILIFE: 0.7, HDFCLIFE: 0.7, DRREDDY: 0.7, WIPRO: 0.7,
  TATACONSUM: 0.6, APOLLOHOSP: 0.6, EICHERMOT: 0.6, ADANIENT: 0.6, 'BAJAJ-AUTO': 0.6, BRITANNIA: 0.5, HEROMOTOCO: 0.5,
  INDUSINDBK: 0.5, BPCL: 0.5,
};
export const weightOf = (sym) => W[sym] ?? 0.5;

export const SECTORS = (() => {
  const m = {};
  for (const u of UNIVERSE) (m[u.sector] ||= []).push(u);
  return Object.entries(m)
    .map(([name, items]) => ({ name, items, weight: items.reduce((a, u) => a + weightOf(u.sym), 0) }))
    .sort((a, b) => b.weight - a.weight);
})();

/** Five bid and five ask levels around `p`; quantities shuffle with the tick. */
export function ladder(sym, p, seed) {
  const r = rng(((seed * 2654435761) ^ sym.length * 97 ^ sym.charCodeAt(0) * 131) >>> 0);
  const step = p > 5000 ? 0.5 : p > 1000 ? 0.1 : 0.05;
  const lot = p > 5000 ? 8 : p > 1500 ? 40 : p > 500 ? 120 : 400;
  const bid = tick05(p - step / 2);
  const ask = tick05(p + step / 2 + 0.05);
  const level = (px, i) => ({ px: tick05(px), qty: Math.round(lot * (0.5 + r() * 2.2) * (1 + i * 0.35)), orders: 1 + Math.floor(r() * 9 + i) });
  const bids = Array.from({ length: 5 }, (_, i) => level(bid - i * step, i));
  const asks = Array.from({ length: 5 }, (_, i) => level(ask + i * step, i));
  return { bids, asks, spread: asks[0].px - bids[0].px };
}

/** Paper charges on a CNC fill (illustrative; not deducted from the paper P&L). */
export function charges(side, qty, px) {
  const turnover = qty * px;
  const brokerage = 20;
  const stt = turnover * 0.001;
  const exch = turnover * 0.0000297;
  const gst = (brokerage + exch) * 0.18;
  const stamp = side === 'BUY' ? turnover * 0.00015 : 0;
  return { brokerage, stt, exch, gst, stamp, total: brokerage + stt + exch + gst + stamp };
}

/** Deterministic latency badge for an order leg. */
export const legMs = (id) => 140 + (String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 120);
