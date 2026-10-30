// Presentation-layer tape recorder. The sim only knows the last price of each stock; this
// samples it into 5-minute OHLC bars (plus illustrative volume) for candles and sparklines.
// History before the first sample is a seeded bridge that ends exactly at the sim's price,
// passing through the entry of any held position. Nothing here feeds back into the sim.
import { useSyncExternalStore } from 'react';
import { useSim } from '../store/useSim.js';
import { UNIVERSE, UNI } from '../data/universe.js';
import { OPEN, CLOSE } from './format.js';
import { rng, gauss, tick05 } from './random.js';

export const BAR = 300; // 5-minute bars
/** Session date as UTC seconds; chart times are DAY0 + seconds since midnight IST, shown as IST. */
export const DAY0 = Date.UTC(2026, 9, 30) / 1000;
export const barStart = (t) => OPEN + Math.floor((Math.max(OPEN, t) - OPEN) / BAR) * BAR;
export const chartTime = (t) => DAY0 + t;

const SYMS = ['NIFTY', ...UNIVERSE.map((u) => u.sym)];
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

let tapes = new Map();
let version = 0;
const listeners = new Set();

const sessionKey = (sim) => (sim.mode === 'demo' ? `demo:${sim.demo.id}` : 'live');

function volumeFor(sym, b, ret, frac = 1) {
  const r = rng(hash(sym) ^ (b * 2654435761));
  const base = sym === 'NIFTY' ? 0 : 40_000 + (hash(sym) % 360_000);
  const day = (b * BAR) / (CLOSE - OPEN);
  const shape = 1.55 - Math.sin(Math.PI * Math.min(1, day)) * 0.95; // heavier at the open and close
  return Math.round(base * shape * (0.65 + r() * 0.7) * (1 + 22 * Math.abs(ret)) * frac);
}

function mkBar(sym, b, o, h, l, c) {
  return { b, time: chartTime(OPEN + b * BAR), open: o, high: h, low: l, close: c, volume: volumeFor(sym, b, c / o - 1) };
}

/** Seeded intraday history from the open to bucket `upto` (exclusive), ending at `last`. */
function synthesize(sym, upto, last, knots) {
  if (upto <= 0) return [];
  const r = rng(hash(`${sym}:hist`));
  const u = UNI[sym];
  const prev = u ? u.prev : last;
  const open = tick05(prev * (1 + (r() - 0.5) * 0.004));
  const pts = [[0, open], ...knots.filter((k) => k[0] > 0 && k[0] < upto * 5), [upto * 5, last]];
  // 1-minute path through every knot, then 5 minutes to a bar
  const mins = [];
  for (let k = 1; k < pts.length; k++) {
    const [m0, p0] = pts[k - 1];
    const [m1, p1] = pts[k];
    const n = Math.max(1, m1 - m0);
    const sd = p0 * 0.0007;
    const w = [0];
    for (let i = 1; i <= n; i++) w.push(w[i - 1] + sd * gauss(r));
    for (let i = k === 1 ? 0 : 1; i <= n; i++) mins.push(p0 + w[i] - (i / n) * (w[n] - (p1 - p0)));
  }
  const bars = [];
  for (let b = 0; b < upto; b++) {
    const seg = mins.slice(b * 5, b * 5 + 6);
    if (seg.length < 2) break;
    const o = seg[0];
    const c = seg[seg.length - 1];
    const wig = o * 0.0006 * (0.4 + r());
    bars.push(mkBar(sym, b, tick05(o), tick05(Math.max(...seg) + wig * r()), tick05(Math.min(...seg) - wig * r()), tick05(c)));
  }
  return bars;
}

function knotsFor(sim, sym) {
  const out = [];
  const pos = sim.positions.find((p) => p.sym === sym) || sim.closed.find((c) => c.sym === sym);
  if (pos && pos.openedAt > OPEN) out.push([Math.round((pos.openedAt - OPEN) / 60), pos.entry]);
  return out;
}

function priceOf(sim, sym) {
  return sym === 'NIFTY' ? sim.nifty.p : sim.universe[sym].p;
}

function push(tape, sim, sym, t, p) {
  const series = tape.series[sym];
  const b = Math.floor((t - OPEN) / BAR);
  if (!series.bars.length) {
    series.bars = synthesize(sym, b, p, knotsFor(sim, sym));
    const o = series.bars.length ? series.bars[series.bars.length - 1].close : p;
    series.bars.push(mkBar(sym, b, o, Math.max(o, p), Math.min(o, p), p));
    return;
  }
  let last = series.bars[series.bars.length - 1];
  if (b < last.b) return;
  if (b > last.b + 1) {
    // the replay fast-forwards: fill skipped bars on a straight line with a little texture
    const r = rng(hash(sym) ^ b);
    const from = last.close;
    for (let k = last.b + 1; k < b; k++) {
      const f = (k - last.b) / (b - last.b);
      const o = series.bars[series.bars.length - 1].close;
      const c = tick05(from + (p - from) * f + from * 0.0008 * (r() - 0.5));
      const span = o * 0.0009 * (0.4 + r());
      series.bars.push(mkBar(sym, k, o, tick05(Math.max(o, c) + span * r()), tick05(Math.min(o, c) - span * r()), c));
    }
    last = series.bars[series.bars.length - 1];
  }
  if (b === last.b) {
    if (p === last.close) return;
    last.high = Math.max(last.high, p);
    last.low = Math.min(last.low, p);
    last.close = p;
    last.volume = Math.max(last.volume, volumeFor(sym, b, p / last.open - 1, Math.min(1, ((t - OPEN) % BAR) / BAR + 0.15)));
    series.rev += 1;
  } else {
    series.bars.push(mkBar(sym, b, last.close, Math.max(last.close, p), Math.min(last.close, p), p));
  }
}

function record(sim) {
  if (sim.t < OPEN) return;
  const key = sessionKey(sim);
  let tape = tapes.get(key);
  const t = Math.min(sim.t, CLOSE);
  if (!tape || t < tape.lastT - 1) {
    tape = { series: Object.fromEntries(SYMS.map((s) => [s, { bars: [], rev: 0 }])), lastT: t };
    tapes.set(key, tape);
    if (tapes.size > 3) tapes = new Map([...tapes].slice(-3));
  }
  if (t === tape.lastT && tape.series.NIFTY.bars.length) return;
  for (const sym of SYMS) push(tape, sim, sym, t, priceOf(sim, sym));
  tape.lastT = t;
  version += 1;
  listeners.forEach((l) => l());
}

useSim.subscribe((st) => record(st.sim));
record(useSim.getState().sim);

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Re-renders on every recorded tick. Bars are mutated in place, so `v` is the change signal. */
export function useTape(sym) {
  const v = useSyncExternalStore(subscribe, () => version);
  return { bars: getBars(sym), v };
}

export function getBars(sym) {
  const sim = useSim.getState().sim;
  const tape = tapes.get(sessionKey(sim));
  return (tape && tape.series[sym] && tape.series[sym].bars) || [];
}

/** Close prices for a sparkline, sampled down to at most `n` points. */
export function sparkOf(bars, n = 40) {
  if (!bars.length) return [];
  const step = Math.max(1, Math.ceil(bars.length / n));
  const out = [];
  for (let i = 0; i < bars.length; i += step) out.push(bars[i].close);
  if (out[out.length - 1] !== bars[bars.length - 1].close) out.push(bars[bars.length - 1].close);
  return out;
}

export const tapeVersion = () => version;
export { subscribe as subscribeTape };
