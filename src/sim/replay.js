// Replay mode: a scripted 1:52 session for the demo video. Every number in the
// script is derived from the same prices the dashboard shows, so the views agree.
import { UNIVERSE } from '../data/universe.js';
import { AM_NEWS, MIDDAY_NEWS } from '../data/history.js';
import { interp, wig, tick05, round2 } from '../lib/random.js';
import { T, inr, rStr } from '../lib/format.js';
import {
  START, NIFTY_PREV, baseState, say, tool, think, audit, toast, propose, startChecks, openPosition, closePosition,
  modifyTarget, journalNote, addJournal, engageKill, equityOf, setStage,
} from './core.js';
import { journalINFY, journalLT, LT_RESIZED } from './live.js';

export const DEMO_END = 112;
export const KILL_CUE = [80, 86];

export const DEMO_STEPS = [
  { at: 0, title: 'Goal', caption: 'The trader states the job in plain words. Niyam turns it into one goal and three hard limits.' },
  { at: 7, title: 'Plan', caption: 'Scan 50 stocks, triage the news, tag the regime, pick strategies and run each through the backtest gate.' },
  { at: 30, title: 'Act', caption: 'Size from the 1% risk budget, pass the risk check, place a bracket order and write the journal. An oversized LT order gets vetoed.' },
  { at: 53, title: 'Re-plan', caption: 'A midday news shock flips the regime to volatile. Niyam pauses new entries and trims a target. No stop is loosened.' },
  { at: 69.5, title: 'Limit', caption: 'Sell-off into the close: a stop fires and the daily-loss gauge climbs toward −2%. The human presses the kill switch.' },
  { at: 95.5, title: 'Result', caption: 'The loss stayed inside the −2% limit while buy-and-hold fell further. Over four years, Niyam beats buy-and-hold on return and drawdown.' },
];

// replay seconds → market clock
const CLOCK = [
  [0, T(9, 5)], [7, T(9, 15)], [29, T(9, 30, 30)], [30, T(9, 31)], [37.5, T(9, 31, 40)], [43.8, T(10, 5)],
  [51.8, T(10, 5, 24)], [53.4, T(10, 6)], [56.2, T(12, 38)], [58.4, T(12, 39, 10)], [66, T(12, 42)], [69.5, T(14, 48)],
  [73.6, T(14, 50, 40)], [80, T(14, 52)], [86, T(14, 53, 10)], [94, T(15, 29)], [96, T(15, 30)], [112, T(15, 30)],
];

// replay seconds → price keyframes
const PATHS = {
  NIFTY: [[0, 25612], [7, 25640], [30, 25668], [44, 25690], [53.4, 25702], [56.2, 25748], [58, 25705], [62, 25690], [70, 25560], [74, 25420], [78, 25215], [81, 25120], [96, 24963], [112, 24963]],
  INFY: [[0, 1494.0], [8, 1496.2], [30, 1500.0], [36, 1500.4], [44, 1503.5], [53.4, 1506.0], [56.2, 1531.2], [58, 1514.0], [62, 1508.5], [70, 1497.0], [74, 1478.0], [78, 1458.5], [81, 1449.2], [96, 1446.8], [112, 1446.8]],
  LT: [[0, 3788], [30, 3801], [44, 3809], [46, 3812.5], [52, 3815], [53.4, 3818], [56.2, 3861], [60, 3842], [70, 3772], [72.5, 3700], [73.6, 3669.5], [76, 3655], [96, 3648], [112, 3648]],
  SUNPHARMA: [[0, 1690], [30, 1679], [60, 1672], [80, 1652], [112, 1648]],
  HDFCBANK: [[0, 993], [60, 996], [80, 978], [112, 976]],
};

const VIEWS = [
  [0, 'activity'], [18.8, 'architecture'], [30, 'dashboard'], [37.6, 'journal'], [45, 'risk'],
  [53, 'activity'], [69.5, 'dashboard'], [88, 'risk'], [95.5, 'backtest'],
];

const INFY_PROPOSAL = {
  sym: 'INFY', strategy: 'Trend-EMA', side: 'BUY', entry: 1500, stop: 1440, target: 1620, qty: 166,
  value: 249000, riskRs: 9960, riskPct: 0.00996, sizePct: 0.249, formula: '₹10,000 ÷ ₹60 stop distance = 166 sh',
  checks: [
    { k: 'Risk per trade ≤ 1%', v: '1.00%', res: 'ok' },
    { k: 'Position ≤ 25% of equity', v: '24.9%', res: 'ok' },
    { k: 'Open slots ≤ 4', v: '1 of 4', res: 'ok' },
    { k: 'Daily headroom ≥ 1 trade', v: '₹20,000', res: 'ok' },
    { k: 'No results within 2 days', v: 'clear', res: 'ok' },
    { k: 'Paper endpoint only', v: 'NiyamEx', res: 'ok' },
  ],
};

const LT_REQUEST = {
  sym: 'LT', strategy: 'Breakout', side: 'BUY', entry: 3812.5, stop: 3672.5, target: 4092.5, qty: 104,
  value: 396500, riskRs: 14560, riskPct: 0.01456, sizePct: 0.3965, requested: true, formula: 'planner request: ~40% of equity = 104 sh',
  checks: [
    { k: 'Risk per trade ≤ 1%', v: '1.46%', res: 'fail' },
    { k: 'Position ≤ 25% of equity', v: '39.7%', res: 'fail' },
    { k: 'Open slots ≤ 4', v: '2 of 4', res: 'ok' },
    { k: 'Daily headroom ≥ 1 trade', v: '₹20,000+', res: 'ok' },
    { k: 'No results within 2 days', v: 'clear', res: 'ok' },
    { k: 'Paper endpoint only', v: 'NiyamEx', res: 'ok' },
  ],
};

const INFY_FILL = { sym: 'INFY', qty: 166, entry: 1500.4, stop: 1440, target: 1620, strategy: 'Trend-EMA', regime: 'Trend', journal: 'T-0417', oid: 'NX-24817' };
const LT_FILL = { sym: 'LT', qty: 65, entry: 3812.5, stop: 3672.5, target: 4092.5, strategy: 'Breakout', regime: 'Trend', journal: 'T-0418', oid: 'NX-24822' };

const has = (s, sym) => s.positions.some((p) => p.sym === sym);

function summarize(s) {
  const day = equityOf(s) - START;
  const bhPct = s.nifty.p / s.nifty.open - 1;
  return {
    dayPnl: day,
    dayPct: day / START,
    bhPct,
    bhPnl: START * bhPct,
    saved: day - START * bhPct,
    maxUsed: s.maxUsed,
    trades: s.closed.length + s.positions.length,
    stops: s.closed.filter((c) => c.reason === 'stop').length,
    vetoes: s.audit.filter((a) => a.day === 'Today' && a.type === 'VETO').length,
    haltedBy: s.halt ? s.halt.by : null,
  };
}

const SCRIPT = [
  [0.6, (d) => say(d, { kind: 'system', icon: 'History', text: 'Replay · Fri 30 Oct 2026 · paper account NX-PAPER-01 · ₹10,00,000 cash · no positions' })],
  [1.4, (d) => {
    say(d, { kind: 'user', actor: 'You', text: 'Swing-trade NIFTY 50 today. Risk 1% a trade; stop me at −2% for the day.' });
    setStage(d, 'reason', 'SCAN');
  }],
  [4.0, (d) => think(d, 'Goal parsed into one goal and three hard limits. The limits live in the risk engine, not in my prompt.', 1.2, {
    chips: ['1% risk / trade = ₹10,000', '−2% daily loss = ₹20,000', '25% max position = ₹2,50,000'],
    node: 'SCAN',
    onDone: (dd) => toast(dd, 'acid', 'Limits armed', '1% per trade · −2% per day · 25% per position'),
  })],
  [5.6, (d) => {
    say(d, { kind: 'system', icon: 'ShieldCheck', text: 'Startup self-test passed · paper endpoint ✓ · live endpoints blocked ✓ · kill switch armed ✓' });
    audit(d, { type: 'BLOCK', rule: 'Paper-only allowlist', detail: 'Startup self-test: request to live endpoint api.kite.trade refused.', actor: 'Broker adapter' });
  }],
  [6.2, (d) => tool(d, 'event_calendar', 'NIFTY50 · next 2 days', 'HDFCBANK results tomorrow · F&O expiry Tue', 0.8)],
  [7.2, (d) => say(d, { kind: 'system', icon: 'Bell', text: 'NSE open 09:15 · loop 1/25 started' })],
  [8.4, (d) => tool(d, 'get_ohlcv', 'NIFTY50 · 15m · 60d', '50 symbols · 3,000 bars', 1.2)],
  [10.8, (d) => tool(d, 'news_sentiment', '50 symbols · Haiku 5.5', '38 headlines triaged · 4 material · INFY +0.62', 1.6, {
    onDone: (dd) => {
      dd.news = AM_NEWS.map((n) => ({ ...n }));
      dd.models.haiku.calls += 4;
      dd.models.haiku.tokens += 21400;
    },
  })],
  [13.6, (d) => {
    d.regime = { label: 'TREND', conf: 0.74, adx: 27, vix: 13.2 };
    say(d, { kind: 'decision', text: 'Regime → TREND · NIFTY ADX 27 · India VIX 13.2 · confidence 0.74' });
    setStage(d, 'reason', 'REGIME');
  }],
  [15.6, (d) => think(d, 'Three candidates this loop. HDFCBANK is skipped: results are due tomorrow.', 1.6, {
    list: ['INFY · Trend-EMA · ADX 31, news +0.62', 'LT · 20-day breakout · watching volume', 'SUNPHARMA · RSI-2 oversold · needs the gate'],
  })],
  [19.4, (d) => tool(d, 'run_backtest', 'INFY · Trend-EMA · 3y', 'Sharpe 1.12 vs 0.61 buy-and-hold · max DD −7.8% · 41 trades → gate passed', 1.8)],
  [22.6, (d) => tool(d, 'run_backtest', 'SUNPHARMA · RSI-2 · 3y', 'Sharpe 0.52 vs 0.66 buy-and-hold → gate failed · not traded', 1.4, {
    status: 'fail',
    onDone: (dd) => audit(dd, { type: 'GATE', rule: 'Backtest gate', detail: 'SUNPHARMA RSI-2 failed: Sharpe 0.52 vs 0.66 buy-and-hold. Not traded.', actor: 'Backtest gate' }),
  })],
  [25.6, (d) => tool(d, 'run_backtest', 'LT · Breakout · 3y', 'Sharpe 0.94 vs 0.58 buy-and-hold · max DD −9.1% → gate passed', 1.4)],

  // Act
  [30.0, (d) => {
    propose(d, INFY_PROPOSAL);
    tool(d, 'size_position', 'INFY · entry ₹1,500 · stop ₹1,440 (2×ATR)', '166 sh · ₹2,49,000 (24.9%) · risk ₹9,960 (1.0%)', 1.0);
  }],
  [31.6, (d) => {
    startChecks(d, 1.6);
    tool(d, 'risk_check', 'INFY BUY 166', 'approved · 6 of 6 checks passed', 1.8, {
      onDone: (dd) => {
        if (dd.proposal) dd.proposal.verdict = 'approved';
      },
    });
  }],
  [34.2, (d) => tool(d, 'place_bracket', 'BUY 166 INFY · SL-M ₹1,440 · TGT ₹1,620', 'order NX-24817 filled ₹1,500.40', 1.2, {
    onDone: (dd) => openPosition(dd, INFY_FILL),
  })],
  [36.4, (d) => {
    if (!has(d, 'INFY')) return;
    addJournal(d, journalINFY(Date.now()));
    tool(d, 'write_journal', 'T-0417', 'written · numbers match the ledger', 0.8);
  }],
  [44.0, (d) => think(d, 'LT broke its 20-day high on 1.6× average volume. High conviction: requesting a 40% position.', 1.4, {
    onDone: (dd) => propose(dd, LT_REQUEST),
  })],
  [46.2, (d) => {
    startChecks(d, 1.0);
    tool(d, 'risk_check', 'LT BUY · ~40% of equity', 'VETO · 39.7% > 25% max position · risk 1.46% > 1%', 1.2, {
      status: 'veto',
      onDone: (dd) => {
        if (dd.proposal) dd.proposal.verdict = 'veto';
        audit(dd, { type: 'VETO', rule: 'Max position 25%', detail: 'Planner asked for ~40% (₹3,96,500) in LT. Order refused; resized to 65 sh (24.8%).', actor: 'Risk engine' });
        toast(dd, 'rose', 'Risk engine veto', 'LT 39.7% > 25% cap · resizing to 65 sh');
      },
    });
  }],
  [48.4, (d) => tool(d, 'size_position', 'LT · cap 25% · stop ₹3,672.50', '65 sh · ₹2,47,812 (24.8%) · risk ₹9,100 (0.91%)', 0.8, {
    onDone: (dd) => propose(dd, LT_RESIZED),
  })],
  [49.6, (d) => {
    startChecks(d, 0.8);
    tool(d, 'risk_check', 'LT BUY 65', 'approved · 6 of 6 checks passed', 1.0, {
      onDone: (dd) => {
        if (dd.proposal) dd.proposal.verdict = 'approved';
      },
    });
  }],
  [50.8, (d) => tool(d, 'place_bracket', 'BUY 65 LT · SL-M ₹3,672.50 · TGT ₹4,092.50', 'order NX-24822 filled ₹3,812.50', 0.9, {
    onDone: (dd) => {
      openPosition(dd, LT_FILL);
      addJournal(dd, journalLT(Date.now()));
    },
  })],

  // Re-plan
  [53.4, (d) => say(d, { kind: 'system', icon: 'FastForward', text: 'Fast-forward to 12:38 · loops 4 to 14 · no new entries · both positions in profit' })],
  [56.4, (d) => tool(d, 'news_sentiment', 'IT sector · 6 headlines', `“${MIDDAY_NEWS.head}” · IT −0.48 · INFY −0.41 · material`, 1.2, {
    onDone: (dd) => {
      dd.news.unshift({ ...MIDDAY_NEWS, t: Math.round(dd.t) });
      dd.models.haiku.calls += 1;
      dd.models.haiku.tokens += 6100;
    },
  })],
  [58.4, (d) => {
    d.regime = { label: 'VOLATILE', conf: 0.81, adx: 24.1, vix: 17.9 };
    say(d, { kind: 'decision', tone: 'amber', text: 'India VIX 13.2 → 17.9 in 20 minutes (+36%). Regime → VOLATILE · confidence 0.81' });
    toast(d, 'amber', 'Regime flip', 'TREND → VOLATILE · re-plan triggered');
    setStage(d, 'reason', 'REGIME');
  }],
  [60.2, (d) => think(d, 'Re-plan triggered by the news shock and the regime flip.', 1.8, {
    tone: 'amber',
    list: [
      'Pause new entries while India VIX > 16 (sit out)',
      'Keep every stop where it is. Stops can be tightened, never loosened',
      'Trim the INFY target from ₹1,620 to ₹1,560',
    ],
  })],
  [63.4, (d) => tool(d, 'risk_check', 'modify INFY target → ₹1,560', 'approved · no new risk', 0.8)],
  [64.6, (d) => tool(d, 'place_bracket', 'modify NX-24817 · TGT ₹1,560', 'target modified', 0.7, {
    onDone: (dd) => modifyTarget(dd, 'INFY', 1560),
  })],
  [65.8, (d) => {
    if (!d.journal.some((e) => e.id === 'T-0417')) return;
    journalNote(d, 'T-0417', 'Re-planned: the IT budget headline turned the news negative and India VIX jumped. Target trimmed to ₹1,560; the stop stays at ₹1,440. No new entries while VIX > 16.');
    tool(d, 'write_journal', 'T-0417 · re-plan note', 'note added', 0.6);
  }],

  // Limit
  [70.0, (d) => say(d, { kind: 'system', icon: 'FastForward', text: 'Fast-forward to 14:48 · broad sell-off into the close · NIFTY −1.6%' })],
  [73.6, (d) => {
    if (!has(d, 'LT')) return;
    const r = closePosition(d, 'LT', 3664.8, 'stop');
    say(d, { kind: 'risk', tone: 'rose', text: `Stop hit · LT SL-M filled ₹3,664.80 (₹7.70 slippage) · ${inr(r.pnl, 2, true)} (${rStr(r.R)})` });
    toast(d, 'rose', 'Stop hit · LT', `${inr(r.pnl, 2, true)} · ${rStr(r.R)}`);
    setStage(d, 'broker', 'MONITOR');
  }],
  [74.6, (d) => {
    if (d.journal.some((e) => e.id === 'T-0418' && e.status === 'closed')) tool(d, 'write_journal', 'T-0418 · exit', 'exit written · loss within plan', 0.6);
  }],
  [80.0, (d) => {
    if (!d.halted) say(d, { kind: 'system', tone: 'rose', icon: 'Hand', text: 'Human check: the day is near its loss limit. Press the kill switch to cancel, flatten and lock.' });
  }],
  [86.0, (d) => {
    if (!d.halted) engageKill(d, 'demo');
  }],
  [87.0, (d) => {
    if (d.journal.some((e) => e.id === 'T-0417' && e.exitReason === 'kill')) tool(d, 'write_journal', 'T-0417 · exit', 'exit written · kill switch', 0.6);
  }],
  [94.2, (d) => say(d, { kind: 'system', icon: 'Bell', text: 'NSE close 15:30 · session summary written to the journal' })],
  [95.6, (d) => {
    d.demo.summary = summarize(d);
  }],
];

function setPrices(s, t) {
  const n = interp(PATHS.NIFTY, t) * (1 + 0.00018 * wig(3.1, t * 0.9));
  s.nifty.p = round2(n);
  const ret = n / NIFTY_PREV - 1;
  for (const u of UNIVERSE) {
    const kf = PATHS[u.sym];
    let p;
    if (kf) {
      p = interp(kf, t) * (1 + 0.00032 * wig(u.i * 1.37, t * 1.3));
    } else {
      let x = u.beta * ret + u.bias + 0.0035 * wig(u.i * 2.9 + 1, t * 0.21);
      if (u.sector === 'IT' && t > 56.5) x -= 0.011 * Math.min(1, (t - 56.5) / 3);
      if (u.sector === 'Infra' && t > 70) x -= 0.006 * Math.min(1, (t - 70) / 5);
      p = u.prev * (1 + x);
    }
    s.universe[u.sym].p = tick05(p);
  }
}

export function createDemoState() {
  const s = baseState('demo');
  s.regime = { label: 'PRE-OPEN', conf: 0, adx: 0, vix: 13.0 };
  s.demo = {
    id: Date.now(),
    t: 0,
    paused: false,
    step: 0,
    autoFollow: true,
    captions: true,
    killCue: false,
    finished: false,
    summary: null,
    cue: null,
    cueN: 0,
  };
  setPrices(s, 0);
  for (const [at, fn] of SCRIPT) s.queue.push({ at, fn });
  for (const [at, view] of VIEWS) {
    s.queue.push({
      at,
      fn: (d) => {
        d.demo.cueN += 1;
        d.demo.cue = { n: d.demo.cueN, view };
      },
    });
  }
  s.nextFeedAt = Infinity;
  return s;
}

export function stepDemo(s, dt) {
  const D = s.demo;
  D.t = Math.min(DEMO_END, D.t + dt);
  s.t = interp(CLOCK, D.t);
  setPrices(s, D.t);
  let k = 0;
  for (let i = 0; i < DEMO_STEPS.length; i++) if (D.t >= DEMO_STEPS[i].at) k = i;
  D.step = k;
  D.killCue = D.t >= KILL_CUE[0] && D.t < KILL_CUE[1] && !s.halted;
  if (D.t >= DEMO_END) {
    D.finished = true;
    D.paused = true;
  }
}
