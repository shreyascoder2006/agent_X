// Live mode: a session already in progress at 11:41 IST that keeps ticking on its own.
import { UNIVERSE } from '../data/universe.js';
import { AM_NEWS, NEWS_POOL, LOOP_CANDIDATES, LIVE_FEED, TODAY_AUDIT } from '../data/history.js';
import { rng, gauss, clamp, tick05, round1, round2, bridge } from '../lib/random.js';
import { T, OPEN, hm, inr, fmtP, loopNo } from '../lib/format.js';
import {
  START, NIFTY_OPEN, rnd, baseState, later, say, tool, think, setStage, closePosition, equityOf, toast,
} from './core.js';

export const LIVE_SPEED = 5; // market seconds per real second
export const LIVE_START = T(11, 41, 30);
export const LIVE_END = T(15, 20);

const INFY = { sym: 'INFY', qty: 166, entry: 1500.4, stop: 1440, target: 1620, strategy: 'Trend-EMA', regime: 'Trend', journal: 'T-0417', oid: 'NX-24817', at: T(9, 31, 5), now: 1521.8 };
const LT = { sym: 'LT', qty: 65, entry: 3812.5, stop: 3672.5, target: 4092.5, strategy: 'Breakout', regime: 'Trend', journal: 'T-0418', oid: 'NX-24822', at: T(10, 5, 16), now: 3826.4 };

export const LT_RESIZED = {
  sym: 'LT', strategy: 'Breakout', side: 'BUY', entry: 3812.5, stop: 3672.5, target: 4092.5, qty: 65,
  value: 247812.5, riskRs: 9100, riskPct: 0.0091, sizePct: 0.2478,
  formula: 'min(₹10,000 ÷ ₹140 = 71, 25% cap = 65) = 65 sh',
  checks: [
    { k: 'Risk per trade ≤ 1%', v: '0.91%', res: 'ok' },
    { k: 'Position ≤ 25% of equity', v: '24.8%', res: 'ok' },
    { k: 'Open slots ≤ 4', v: '2 of 4', res: 'ok' },
    { k: 'Daily headroom ≥ 1 trade', v: '₹20,000+', res: 'ok' },
    { k: 'No results within 2 days', v: 'clear', res: 'ok' },
    { k: 'Paper endpoint only', v: 'NiyamEx', res: 'ok' },
  ],
};

export function journalINFY(born = 0) {
  return {
    id: 'T-0417', day: 'Today', t: T(9, 31, 8), sym: 'INFY', side: 'BUY', strategy: 'Trend-EMA', regime: 'Trend',
    qty: 166, entry: 1500.4, stop: 1440, target: 1620, riskRs: 9960, riskPct: 0.00996, news: '+0.62', backtest: 'Sharpe 1.12 vs 0.61',
    status: 'open', verified: true, born, notes: [],
    prose: 'Bought 166 INFY at ₹1,500.40. Trend-EMA and the news agree: price is above its 20- and 50-period EMAs with ADX 31, and a large multi-year deal headline scored +0.62. I am wrong below ₹1,440, a ₹9,960 loss, 1% of the account. Target ₹1,620, twice the risk. Skipped HDFCBANK because results are due tomorrow.',
    tools: ['get_ohlcv', 'news_sentiment', 'event_calendar', 'run_backtest', 'size_position', 'risk_check', 'place_bracket', 'write_journal'],
  };
}

export function journalLT(born = 0) {
  return {
    id: 'T-0418', day: 'Today', t: T(10, 5, 19), sym: 'LT', side: 'BUY', strategy: 'Breakout', regime: 'Trend',
    qty: 65, entry: 3812.5, stop: 3672.5, target: 4092.5, riskRs: 9100, riskPct: 0.0091, news: '+0.08', backtest: 'Sharpe 0.94 vs 0.58',
    status: 'open', verified: true, born, notes: [], vetoed: true,
    prose: 'Bought 65 LT at ₹3,812.50 on a 20-day breakout with 1.6× average volume. I asked for a 40% position; the risk engine vetoed it and capped me at 25%, so the size is 65 shares. I am wrong below ₹3,672.50, a ₹9,100 loss (0.91%). Target ₹4,092.50, twice the risk.',
    tools: ['get_ohlcv', 'news_sentiment', 'run_backtest', 'risk_check', 'size_position', 'risk_check', 'place_bracket', 'write_journal'],
  };
}

export function createLiveState() {
  const s = baseState('live');
  s.t = LIVE_START;
  const r = rng(7);

  // prices: a mildly positive day
  for (const u of UNIVERSE) {
    const chg = u.beta * 0.0025 + u.bias * 0.5 + gauss(r) * 0.0065;
    const p = tick05(u.prev * (1 + chg));
    s.universe[u.sym] = { p, anchor: p };
  }
  s.universe.INFY = { p: INFY.now, anchor: INFY.now };
  s.universe.LT = { p: LT.now, anchor: LT.now };
  s.nifty = { ...s.nifty, p: 25705, anchor: 25705 };

  // positions and bracket legs
  for (const o of [INFY, LT]) {
    s.positions.push({ id: ++s.seq, sym: o.sym, qty: o.qty, entry: o.entry, stop: o.stop, target: o.target, strategy: o.strategy, regime: o.regime, openedAt: o.at, journal: o.journal, oid: o.oid });
    s.orders.push(
      { id: `${o.oid}-SL`, sym: o.sym, kind: 'SL-M', side: 'SELL', qty: o.qty, price: o.stop, status: 'open', at: o.at },
      { id: `${o.oid}-TP`, sym: o.sym, kind: 'LMT', side: 'SELL', qty: o.qty, price: o.target, status: 'open', at: o.at },
    );
  }

  // intraday curve 09:15 → now, bridged so it ends exactly at today's marks
  const mins = [];
  for (let t = OPEN; t <= s.t; t += 60) mins.push(t);
  const last = mins.length - 1;
  const idx = (t) => Math.round((t - OPEN) / 60);
  const nifty = bridge(r, NIFTY_OPEN, 25705, last, NIFTY_OPEN * 0.00045);
  const iI = idx(INFY.at);
  const iL = idx(LT.at);
  const infy = bridge(r, INFY.entry, INFY.now, last - iI, INFY.entry * 0.0011);
  const lt = bridge(r, LT.entry, LT.now, last - iL, LT.entry * 0.0012);
  s.curve = mins.map((t, k) => {
    let eq = START;
    if (k >= iI) eq += (infy[k - iI] - INFY.entry) * INFY.qty;
    if (k >= iL) eq += (lt[k - iL] - LT.entry) * LT.qty;
    return { t, eq: round2(eq), bh: round2((START * nifty[k]) / NIFTY_OPEN) };
  });
  s.curveLastT = mins[last];
  s.marks = [
    { k: 1, t: mins[iI], y: s.curve[iI].eq, label: 'B INFY', tone: '#C6FF00' },
    { k: 2, t: mins[iL], y: s.curve[iL].eq, label: 'B LT', tone: '#C6FF00' },
  ];

  // morning history
  s.feed = LIVE_FEED.map((f) => ({ id: ++s.seq, born: 0, ...f }));
  s.journal = [journalLT(0), journalINFY(0), ...s.journal];
  s.audit = [...TODAY_AUDIT.map((a) => ({ ...a })), ...s.audit];
  s.news = AM_NEWS.map((n) => ({ ...n }));
  s.regime = { label: 'TREND', conf: 0.74, adx: 28.2, vix: 13.4 };
  s.node = 'MONITOR';
  s.stage = 'broker';
  s.proposal = { ...LT_RESIZED, verdict: 'approved', requested: false, checks: LT_RESIZED.checks.map((c) => ({ ...c, at: -1 })) };
  const st = s.toolStats;
  Object.assign(st.get_ohlcv, { calls: 11, ms: 11 * 640, last: T(11, 30, 4) });
  Object.assign(st.news_sentiment, { calls: 12, ms: 12 * 1650, last: T(11, 30, 9), flags: 0 });
  Object.assign(st.event_calendar, { calls: 1, ms: 640, last: T(9, 14, 20) });
  Object.assign(st.run_backtest, { calls: 5, ms: 5 * 1560, last: T(11, 15, 22), flags: 2 });
  Object.assign(st.size_position, { calls: 3, ms: 3 * 34, last: T(10, 5, 13) });
  Object.assign(st.risk_check, { calls: 14, ms: 14 * 12, last: T(11, 30, 12), flags: 1 });
  Object.assign(st.place_bracket, { calls: 2, ms: 460, last: T(10, 5, 16) });
  Object.assign(st.write_journal, { calls: 2, ms: 2570, last: T(10, 5, 19) });
  s.models = { sonnet: { calls: 16, tokens: 41200 }, haiku: { calls: 44, tokens: 118400 } };
  s.loopDone = loopNo(s.t);
  s.nextFeedAt = 2.5;
  return s;
}

function stepPrices(s, dts) {
  const k = Math.sqrt(dts);
  for (const u of UNIVERSE) {
    const q = s.universe[u.sym];
    const sig = 0.0001 * (0.55 + 0.5 * u.beta);
    const pull = ((q.anchor - q.p) / q.p) * 0.004 * dts;
    q.p = tick05(q.p * (1 + pull + sig * k * gauss(rnd)));
    q.anchor *= 1 + 0.000018 * k * gauss(rnd);
  }
  const n = s.nifty;
  n.p = round2(n.p * (1 + ((n.anchor - n.p) / n.p) * 0.004 * dts + 0.00006 * k * gauss(rnd)));
  n.anchor *= 1 + 0.000012 * k * gauss(rnd);
}

function checkStops(s) {
  for (const p of [...s.positions]) {
    const px = s.universe[p.sym].p;
    if (px <= p.stop) {
      const r = closePosition(s, p.sym, tick05(p.stop - 0.4), 'stop');
      say(s, { kind: 'risk', tone: 'rose', text: `Stop hit · ${p.sym} SL-M filled ₹${fmtP(p.stop - 0.4)} · ${inr(r.pnl, 2, true)}` });
      toast(s, 'rose', `Stop hit · ${p.sym}`, inr(r.pnl, 2, true));
    } else if (px >= p.target) {
      const r = closePosition(s, p.sym, p.target, 'target');
      say(s, { kind: 'risk', tone: 'acid', text: `Target hit · ${p.sym} filled ₹${fmtP(p.target)} · ${inr(r.pnl, 2, true)}` });
      toast(s, 'acid', `Target hit · ${p.sym}`, inr(r.pnl, 2, true));
    }
  }
}

function runLoop(s, n) {
  if (s.halted) {
    say(s, { kind: 'system', icon: 'Lock', text: `Loop ${n}/25 skipped · trading halted` });
    return;
  }
  say(s, { kind: 'system', icon: 'Repeat', text: `Loop ${n}/25 started · ${hm(s.t)} IST` });
  later(s, 0.5, (d) => tool(d, 'get_ohlcv', 'NIFTY50 · 15m', '50 symbols · 15-min bars refreshed', 0.6));
  later(s, 1.7, (d) =>
    tool(d, 'news_sentiment', '50 symbols · Haiku 5.5', `${8 + Math.floor(rnd() * 9)} headlines · ${Math.floor(rnd() * 2)} material`, 1.2, {
      onDone: (dd) => {
        dd.models.haiku.calls += 1;
        dd.models.haiku.tokens += 5400;
      },
    }),
  );
  later(s, 3.3, (d) => {
    const g = d.regime;
    g.adx = round1(clamp(g.adx + (rnd() - 0.5) * 1.6, 23, 33));
    g.vix = round1(clamp(g.vix + (rnd() - 0.5) * 0.4, 12.6, 15.2));
    g.conf = round2(clamp(g.conf + (rnd() - 0.5) * 0.05, 0.62, 0.86));
    say(d, { kind: 'decision', text: `Regime ${g.label} · ADX ${g.adx} · India VIX ${g.vix} · confidence ${g.conf.toFixed(2)}` });
    setStage(d, 'reason', 'REGIME');
  });
  later(s, 4.5, (d) => {
    const c = LOOP_CANDIDATES[n % LOOP_CANDIDATES.length];
    const used = d.positions.length;
    think(d, `No new entry this loop. ${c.sym} (${c.strat}) ${c.why}. ${used} of 4 slots in use.`, 1.3);
  });
  later(s, 6.3, (d) => say(d, { kind: 'system', icon: 'CheckCheck', text: `Loop ${n} complete · next at ${hm(Math.min(OPEN + n * 900, T(15, 30)))} IST` }));
}

function idleLine(s) {
  if (s.halted) {
    if (s.rt - s.lastHaltNote > 18) {
      s.lastHaltNote = s.rt;
      say(s, { kind: 'system', icon: 'Lock', text: 'Halted · no orders will be sent until a human re-arms (2-step)' });
    }
    return;
  }
  const x = rnd();
  if (x < 0.34 && s.positions.length) {
    const p = s.positions[Math.floor(rnd() * s.positions.length)];
    const px = s.universe[p.sym].p;
    const R = (px - p.entry) / (p.entry - p.stop);
    say(s, { kind: 'monitor', text: `${p.sym} ₹${fmtP(px)} · SL-M ₹${fmtP(p.stop)} live · target ₹${fmtP(p.target)} live · ${R >= 0 ? '+' : '−'}${Math.abs(R).toFixed(2)}R` });
    setStage(s, 'broker', 'MONITOR');
    return;
  }
  if (x < 0.56) {
    const n = NEWS_POOL[Math.floor(rnd() * NEWS_POOL.length)];
    const tag = Math.abs(n.score) >= 0.4 ? 'material' : 'noise';
    tool(s, 'news_sentiment', n.sym, `“${n.head}” · ${n.score >= 0 ? '+' : '−'}${Math.abs(n.score).toFixed(2)} · ${tag}`, 1.1, {
      onDone: (d) => {
        d.news.unshift({ ...n, id: `n${++d.seq}`, t: Math.round(d.t) });
        if (d.news.length > 8) d.news.pop();
        d.models.haiku.calls += 1;
        d.models.haiku.tokens += 2300;
      },
    });
    return;
  }
  if (x < 0.78) {
    const eq = equityOf(s);
    const day = eq - START;
    const expo = s.positions.reduce((a, p) => a + s.universe[p.sym].p * p.qty, 0) / eq;
    tool(s, 'risk_check', 'portfolio', `ok · exposure ${(expo * 100).toFixed(1)}% · day ${inr(day, 0, true)} · headroom ${inr(20000 + day)}`, 0.5, { node: 'MONITOR' });
    return;
  }
  tool(s, 'get_ohlcv', 'NIFTY50 · 1m', '50 symbols · ticks refreshed', 0.4, { scan: false, node: 'MONITOR' });
}

export function stepLive(s, dt) {
  const dts = dt * LIVE_SPEED;
  s.t += dts;
  stepPrices(s, dts);
  const n = loopNo(s.t);
  if (n > s.loopDone) {
    s.loopDone = n;
    runLoop(s, n);
    s.nextFeedAt = s.rt + 8;
  }
  if (s.rt >= s.nextFeedAt) {
    s.nextFeedAt = s.rt + 4.5 + rnd() * 4;
    idleLine(s);
  }
  checkStops(s);
}
