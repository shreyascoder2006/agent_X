// Simulation primitives. Every function here mutates an immer draft of the sim state.
// Scheduled callbacks receive the current draft and look things up by id; they never
// hold on to a draft from an earlier tick.
import { UNIVERSE } from '../data/universe.js';
import { HISTORY_JOURNAL, HISTORY_AUDIT } from '../data/history.js';
import { TOOL_META, TOOLS } from '../data/constants.js';
import { rng, tick05, round1 } from '../lib/random.js';
import { OPEN, CLOSE, T, inr, fmtP, rStr, plural } from '../lib/format.js';

export const START = 1_000_000;
export const LIMIT = 20_000;
export const NIFTY_PREV = 25598;
export const NIFTY_OPEN = 25640;
export const rnd = rng(30102026);

export function baseState(mode) {
  return {
    mode,
    seq: 1000,
    rt: 0, // engine seconds (stops while a replay is paused)
    t: T(9, 5), // market clock, seconds since midnight IST
    realized: 0,
    positions: [],
    closed: [],
    orders: [],
    marks: [],
    curve: [],
    curveLastT: 0,
    universe: Object.fromEntries(UNIVERSE.map((u) => [u.sym, { p: u.prev, anchor: u.prev }])),
    nifty: { prev: NIFTY_PREV, open: NIFTY_OPEN, p: NIFTY_OPEN, anchor: NIFTY_OPEN },
    regime: { label: 'TREND', conf: 0.74, adx: 27, vix: 13.2 },
    feed: [],
    journal: HISTORY_JOURNAL.map((j) => ({ ...j })),
    audit: HISTORY_AUDIT.map((a) => ({ ...a })),
    halted: false,
    halt: null,
    rearm: null,
    node: 'MONITOR',
    stage: 'journal',
    stageAt: -10,
    scanAt: -10,
    news: [],
    toolStats: Object.fromEntries(TOOLS.map((k) => [k, { calls: 0, ms: 0, flags: 0, last: null }])),
    models: { sonnet: { calls: 0, tokens: 0 }, haiku: { calls: 0, tokens: 0 } },
    proposal: null,
    queue: [],
    toasts: [],
    demo: null,
    nextFeedAt: 3,
    loopDone: 0,
    lastHaltNote: -99,
    limitNoted: false,
    maxUsed: 0,
  };
}

export function later(s, dt, fn) {
  s.queue.push({ at: s.rt + dt, fn });
}

export function runQueue(s) {
  if (!s.queue.length) return;
  s.queue.sort((a, b) => a.at - b.at);
  let guard = 0;
  while (s.queue.length && s.queue[0].at <= s.rt && guard++ < 60) {
    const job = s.queue.shift();
    job.fn(s);
  }
}

export function findFeed(s, id) {
  for (let i = s.feed.length - 1; i >= 0; i--) if (s.feed[i].id === id) return s.feed[i];
  return null;
}

export function say(s, item) {
  const id = ++s.seq;
  s.feed.push({ id, t: Math.round(s.t), born: Date.now(), ...item });
  if (s.feed.length > 260) s.feed.splice(0, s.feed.length - 260);
  return id;
}

export function audit(s, a) {
  s.audit.unshift({ id: `x${++s.seq}`, day: 'Today', t: Math.round(s.t), ...a });
}

export function toast(s, tone, title, body) {
  s.toasts.push({ id: ++s.seq, tone, title, body, until: Date.now() + 5200 });
  if (s.toasts.length > 4) s.toasts.shift();
}

export function equityOf(s) {
  let u = 0;
  for (const p of s.positions) u += (s.universe[p.sym].p - p.entry) * p.qty;
  return START + s.realized + u;
}

export const bhOf = (s) => (s.t < OPEN ? START : START * (s.nifty.p / s.nifty.open));

export function mark(s, label, tone) {
  s.marks.push({ k: ++s.seq, t: Math.round(s.t), y: Math.round(equityOf(s) * 100) / 100, label, tone });
}

export function setStage(s, stage, node) {
  if (stage) {
    s.stage = stage;
    s.stageAt = s.rt;
  }
  if (node) s.node = node;
}

const TRADE_TOOLS = new Set(['size_position', 'risk_check', 'place_bracket']);

/** A tool call: appears as pending, resolves after `dur` seconds of engine time. */
export function tool(s, name, args, result, dur = 1, o = {}) {
  const meta = TOOL_META[name];
  const id = say(s, { kind: 'tool', tool: name, args, text: result, status: 'pending', ms: Math.round(o.ms ?? dur * 1000) });
  setStage(s, meta.stage, o.node || meta.node);
  if (name === 'get_ohlcv' && o.scan !== false) s.scanAt = s.rt;
  later(s, dur, (d) => {
    const it = findFeed(d, id);
    if (!it) return;
    if (d.halted && TRADE_TOOLS.has(name) && !o.allowHalted) {
      it.status = 'blocked';
      it.text = 'blocked · trading halted by the kill switch';
      return;
    }
    it.status = o.status || 'ok';
    const st = d.toolStats[name];
    st.calls += 1;
    st.ms += it.ms;
    st.last = Math.round(d.t);
    if (it.status === 'veto' || it.status === 'fail') st.flags += 1;
    if (o.onDone) o.onDone(d, id);
  });
  return id;
}

/** A planner (LLM) message: shows a thinking state, then the text types in. */
export function think(s, text, dur = 1.4, o = {}) {
  const id = say(s, {
    kind: 'planner',
    actor: o.actor || 'Planner · Claude Sonnet 5.5',
    text,
    status: 'thinking',
    chips: o.chips || null,
    list: o.list || null,
    tone: o.tone || null,
  });
  setStage(s, 'reason', o.node || 'SELECT');
  later(s, dur, (d) => {
    const it = findFeed(d, id);
    if (it) {
      it.status = 'done';
      it.born = Date.now();
    }
    const m = o.model === 'haiku' ? d.models.haiku : d.models.sonnet;
    m.calls += 1;
    m.tokens += 1400 + text.length * 6;
    if (o.onDone) o.onDone(d, id);
  });
  return id;
}

/** Pre-trade proposal shown on the dashboard and the risk view. */
export function propose(s, p) {
  s.proposal = { ...p, verdict: 'pending', checks: p.checks.map((c) => ({ ...c, at: Infinity })) };
}

/** Ticks the proposal's checks one by one over `dur` seconds. */
export function startChecks(s, dur) {
  if (!s.proposal) return;
  const n = s.proposal.checks.length;
  s.proposal.checks.forEach((c, i) => {
    c.at = s.rt + ((i + 1) * dur) / (n + 1);
  });
}

export function openPosition(s, o) {
  s.positions.push({
    id: ++s.seq,
    sym: o.sym,
    qty: o.qty,
    entry: o.entry,
    stop: o.stop,
    target: o.target,
    strategy: o.strategy,
    regime: o.regime,
    openedAt: Math.round(s.t),
    journal: o.journal,
    oid: o.oid,
  });
  s.orders.push(
    { id: `${o.oid}-SL`, sym: o.sym, kind: 'SL-M', side: 'SELL', qty: o.qty, price: o.stop, status: 'open', at: Math.round(s.t) },
    { id: `${o.oid}-TP`, sym: o.sym, kind: 'LMT', side: 'SELL', qty: o.qty, price: o.target, status: 'open', at: Math.round(s.t) },
  );
  mark(s, `B ${o.sym}`, '#C6FF00');
  toast(s, 'acid', `Filled · BUY ${o.qty} ${o.sym}`, `₹${fmtP(o.entry)} · SL-M ₹${fmtP(o.stop)} · TGT ₹${fmtP(o.target)}`);
}

function exitText(p, px, pnl, R, reason) {
  const sold = `Sold ${p.qty} ${p.sym} at ₹${fmtP(px)}`;
  const amount = inr(Math.abs(pnl), 2);
  if (reason === 'stop') {
    return `${sold}: price fell through my stop at ₹${fmtP(p.stop)}. Loss ${amount} (${rStr(R)}), close to the risk I planned; the rest is slippage on a fast tape.`;
  }
  if (reason === 'target') return `${sold}: the target was reached. Gain ${amount} (${rStr(R)}).`;
  return `${sold} when the kill switch was pressed. ${pnl < 0 ? 'Loss' : 'Gain'} ${amount} (${rStr(R)}). No re-entry until a human re-arms.`;
}

export function closePosition(s, sym, price, reason) {
  const i = s.positions.findIndex((p) => p.sym === sym);
  if (i < 0) return null;
  const p = s.positions[i];
  s.positions.splice(i, 1);
  const pnl = (price - p.entry) * p.qty;
  const risk = (p.entry - p.stop) * p.qty;
  const R = pnl / risk;
  s.realized += pnl;
  s.closed.push({ sym: p.sym, qty: p.qty, entry: p.entry, stop: p.stop, target: p.target, strategy: p.strategy, exit: price, pnl, R, reason, openedAt: p.openedAt, closedAt: Math.round(s.t), oid: p.oid });
  for (const o of s.orders) {
    if (o.sym !== sym || o.status !== 'open') continue;
    if (reason === 'stop' && o.kind === 'SL-M') o.status = 'filled';
    else if (reason === 'target' && o.kind === 'LMT') o.status = 'filled';
    else o.status = 'cancelled';
  }
  const j = s.journal.find((e) => e.id === p.journal);
  if (j) {
    j.status = 'closed';
    j.exit = price;
    j.pnl = pnl;
    j.R = R;
    j.exitReason = reason;
    j.notes.push({ t: Math.round(s.t), text: exitText(p, price, pnl, R, reason) });
  }
  mark(s, `${reason === 'kill' ? 'K' : 'S'} ${sym}`, pnl >= 0 ? '#C6FF00' : '#F43F5E');
  return { pnl, R };
}

export function modifyTarget(s, sym, px) {
  const p = s.positions.find((x) => x.sym === sym);
  if (!p) return;
  const j = s.journal.find((e) => e.id === p.journal);
  if (j && j.targetWas == null) j.targetWas = j.target;
  if (j) j.target = px;
  p.target = px;
  for (const o of s.orders) if (o.sym === sym && o.kind === 'LMT' && o.status === 'open') o.price = px;
}

export function journalNote(s, id, text) {
  const j = s.journal.find((e) => e.id === id);
  if (j) j.notes.push({ t: Math.round(s.t), text, born: Date.now() });
}

export function addJournal(s, entry) {
  s.journal.unshift(entry);
}

export function engageKill(s, by = 'human') {
  if (s.halted) return;
  const open = s.orders.filter((o) => o.status === 'open');
  for (const o of open) o.status = 'cancelled';
  const syms = s.positions.map((p) => p.sym);
  let pnl = 0;
  for (const sym of syms) {
    const r = closePosition(s, sym, tick05(s.universe[sym].p - 0.2), 'kill');
    if (r) pnl += r.pnl;
  }
  const reason =
    by === 'limit' ? 'Daily loss limit −2% reached' : by === 'demo' ? 'Kill switch pressed (replay auto-press)' : 'Kill switch pressed by you';
  s.halted = true;
  s.halt = { at: Math.round(s.t), by, reason, cancelled: open.length, flattened: syms.length, flatMs: round1(1.2 + rnd() * 0.4), pnl };
  s.rearm = null;
  if (s.proposal && s.proposal.verdict === 'pending') s.proposal.verdict = 'halted';
  setStage(s, 'risk', 'MONITOR');
  say(s, {
    kind: 'halt',
    text: `${reason}. Cancelled ${plural(open.length, 'order')}, flattened ${plural(syms.length, 'position')}, locked new orders.`,
    meta: `flat in ${s.halt.flatMs} s`,
  });
  audit(s, {
    type: 'HALT',
    rule: by === 'limit' ? 'Daily loss −2%' : 'Human kill switch',
    detail: `${plural(open.length, 'order')} cancelled, ${plural(syms.length, 'position')} flattened in ${s.halt.flatMs} s (${inr(pnl, 2, true)}). New orders locked.`,
    actor: by === 'limit' ? 'Risk engine' : by === 'demo' ? 'Replay (auto-press)' : 'You',
  });
  toast(s, 'rose', 'Trading halted', `${plural(syms.length, 'position')} flat in ${s.halt.flatMs} s · ${plural(open.length, 'order')} cancelled`);
}

export function rearmStart(s) {
  if (s.halted) s.rearm = { ack: false, until: Date.now() + 15000 };
}
export function rearmAck(s, v) {
  if (s.rearm) s.rearm.ack = v;
}
export function rearmCancel(s) {
  s.rearm = null;
}
export function rearmConfirm(s) {
  if (!s.halted || !s.rearm || !s.rearm.ack) return;
  s.halted = false;
  s.halt = null;
  s.rearm = null;
  s.limitNoted = false;
  audit(s, { type: 'RE-ARM', rule: '2-step confirm', detail: 'Halt reviewed; trading re-armed. New entries resume at the next loop.', actor: 'You' });
  say(s, { kind: 'system', icon: 'Unlock', text: 'Re-armed by you (2-step). Risk engine and broker unlocked; new entries resume at the next loop.' });
  toast(s, 'acid', 'Re-armed', 'Risk engine and broker unlocked');
}

/** Checks that run after every tick in both modes. */
export function postStep(s) {
  const eq = equityOf(s);
  const day = eq - START;
  const used = Math.max(0, -day) / LIMIT;
  if (used > s.maxUsed) s.maxUsed = used;
  if (!s.halted && s.positions.length && used >= 1) {
    engageKill(s, 'limit');
  } else if (!s.halted && used >= 0.75 && !s.limitNoted) {
    s.limitNoted = true;
    const pctUsed = Math.round(used * 100);
    audit(s, {
      type: 'LIMIT',
      rule: 'Daily loss −2%',
      detail: `${pctUsed}% of the daily limit used. New entries blocked: headroom ${inr(LIMIT + day)} is below one trade's risk.`,
      actor: 'Risk engine',
    });
    say(s, { kind: 'risk', tone: 'amber', text: `Daily-loss monitor: ${pctUsed}% of the −2% limit used. New entries blocked; stops stay live.` });
    toast(s, 'amber', 'Loss limit 75% used', 'New entries blocked · stops still live');
  }
  if (s.t >= OPEN && s.t <= CLOSE && s.t - s.curveLastT >= 60) {
    s.curve.push({ t: Math.round(s.t), eq: Math.round(eq * 100) / 100, bh: Math.round(bhOf(s) * 100) / 100 });
    s.curveLastT = s.t;
    if (s.curve.length > 420) s.curve.shift();
  }
  if (s.toasts.length) {
    const now = Date.now();
    if (s.toasts.some((t) => t.until <= now)) s.toasts = s.toasts.filter((t) => t.until > now);
  }
  if (s.rearm && s.rearm.until < Date.now()) s.rearm = null;
}
