// Earlier sessions and this morning's activity. Illustrative paper-trading records.
import { T } from '../lib/format.js';

const closed = (e) => {
  const risk = (e.entry - e.stop) * e.qty;
  const pnl = (e.exit - e.entry) * e.qty;
  return { ...e, riskRs: risk, riskPct: risk / 1e6, pnl, R: pnl / risk, status: 'closed', born: 0, verified: true };
};

export const HISTORY_JOURNAL = [
  closed({
    id: 'T-0416', day: '29 Oct', t: T(10, 46), sym: 'TCS', side: 'BUY', strategy: 'RSI-2', regime: 'Range',
    qty: 82, entry: 3041.2, stop: 2945.2, target: null, exit: 3092.7, exitReason: 'rule', news: '+0.04', backtest: 'Sharpe 0.91 vs 0.55',
    prose: 'Bought 82 TCS at ₹3,041.20 after two sharp down days pushed RSI(2) to 6 while price stayed above its 200-day average. The 25% position cap bound, so risk was ₹7,872 (0.8%). Sold at ₹3,092.70 when RSI(2) crossed 70. Gain ₹4,223.',
    notes: [{ t: T(14, 58), text: 'Exit rule hit: RSI(2) above 70. The mean-reversion setup worked as designed.' }],
    lesson: 'Mean-reversion exits worked as designed. No change.',
    tools: ['get_ohlcv', 'news_sentiment', 'run_backtest', 'size_position', 'risk_check', 'place_bracket', 'write_journal'],
  }),
  closed({
    id: 'T-0415', day: '28 Oct', t: T(9, 46), sym: 'SBIN', side: 'BUY', strategy: 'Breakout', regime: 'Trend',
    qty: 285, entry: 874.3, stop: 839.3, target: 944.3, exit: 838.9, exitReason: 'stop', news: '+0.11', backtest: 'Sharpe 0.88 vs 0.57',
    prose: 'Bought 285 SBIN at ₹874.30 on a 20-day breakout. The breakout failed and price fell through my stop; sold at ₹838.90. Loss ₹10,089, about the 1% I planned to risk.',
    notes: [{ t: T(13, 41), text: 'Stop filled at ₹838.90, 40 paise of slippage. Day loss reached 50% of the limit; warning sent.' }],
    lesson: 'Volume confirmed only on the first 15-minute bar. Wait for a second bar above the breakout level.',
    tools: ['get_ohlcv', 'news_sentiment', 'run_backtest', 'size_position', 'risk_check', 'place_bracket', 'write_journal'],
  }),
  closed({
    id: 'T-0414', day: '27 Oct', t: T(10, 1), sym: 'RELIANCE', side: 'BUY', strategy: 'Trend-EMA', regime: 'Trend',
    qty: 178, entry: 1398.6, stop: 1342.6, target: 1510.6, exit: 1478.4, exitReason: 'trail', news: '+0.18', backtest: 'Sharpe 1.04 vs 0.61',
    prose: 'Bought 178 RELIANCE at ₹1,398.60 with the 20-EMA above the 50-EMA and ADX 29. I trailed the stop under each higher low and sold at ₹1,478.40 when the trail was hit. Gain ₹14,204.',
    notes: [{ t: T(15, 6), text: 'Trailing stop hit. Kept 71% of the move from entry to the high.' }],
    lesson: 'Trailing under higher lows kept most of the trend. Keep it.',
    tools: ['get_ohlcv', 'news_sentiment', 'run_backtest', 'size_position', 'risk_check', 'place_bracket', 'write_journal'],
  }),
  closed({
    id: 'T-0413', day: '26 Oct', t: T(11, 16), sym: 'HCLTECH', side: 'BUY', strategy: 'RSI-2', regime: 'Range',
    qty: 165, entry: 1512.0, stop: 1452.0, target: null, exit: 1531.8, exitReason: 'time', news: '−0.06', backtest: 'Sharpe 0.83 vs 0.59',
    prose: 'Bought 165 HCLTECH at ₹1,512.00 on an RSI(2) dip. Price drifted instead of snapping back, so the 5-day time stop closed it at ₹1,531.80. Gain ₹3,267.',
    notes: [{ t: T(15, 21), text: 'Time stop: five sessions without the RSI(2) exit.' }],
    lesson: 'Slow reversions tie up a slot. The time stop did its job.',
    tools: ['get_ohlcv', 'news_sentiment', 'run_backtest', 'size_position', 'risk_check', 'place_bracket', 'write_journal'],
  }),
  {
    id: 'T-0412', day: '23 Oct', t: T(9, 15), sym: '—', side: '—', strategy: 'Sit out', regime: 'Volatile', status: 'satout', born: 0, verified: true,
    prose: 'No trades today. India VIX opened at 22.4, above my 22 limit, so every new entry was blocked for the session. I kept scanning and logged the candidates: three setups would have triggered and two of them would have hit their stops by the close.',
    notes: [], lesson: 'The volatility gate saved roughly ₹19,000 of paper losses.', tools: ['get_ohlcv', 'news_sentiment', 'write_journal'],
  },
  closed({
    id: 'T-0411', day: '22 Oct', t: T(10, 31), sym: 'ICICIBANK', side: 'BUY', strategy: 'Breakout', regime: 'Trend',
    qty: 178, entry: 1401.5, stop: 1347.5, target: 1509.5, exit: 1347.3, exitReason: 'stop', news: '+0.09', backtest: 'Sharpe 0.79 vs 0.60',
    prose: 'Bought 178 ICICIBANK at ₹1,401.50 on a breakout above a two-week range. A broad bank sell-off took it through my stop; sold at ₹1,347.30. Loss ₹9,648.',
    notes: [{ t: T(14, 9), text: 'Stop filled with 20 paise of slippage. Bank index fell 1.8% on the day.' }],
    lesson: 'Sector-wide selling beat a single-stock setup. Check the sector index before a breakout entry.',
    tools: ['get_ohlcv', 'news_sentiment', 'run_backtest', 'size_position', 'risk_check', 'place_bracket', 'write_journal'],
  }),
];

export const HISTORY_AUDIT = [
  { id: 'a6', day: '29 Oct', t: T(11, 2, 44), type: 'RETRY', rule: 'Tool failure', detail: 'news_sentiment timed out after 2.0 s. Retried with backoff; succeeded on try 2 in 0.7 s.', actor: 'Tool runner' },
  { id: 'a5', day: '28 Oct', t: T(13, 41, 9), type: 'LIMIT', rule: 'Daily loss −2%', detail: 'Day loss reached 50% of the limit after the SBIN stop. Warning sent; entries still allowed.', actor: 'Risk engine' },
  { id: 'a4', day: '27 Oct', t: T(10, 0, 31), type: 'VETO', rule: 'Risk per trade 1%', detail: 'Planner widened the RELIANCE stop to 3×ATR; at the same size, risk was 1.4%. Resized to 178 sh (1.0%).', actor: 'Risk engine' },
  { id: 'a3', day: '23 Oct', t: T(9, 15, 2), type: 'SIT-OUT', rule: 'Volatility gate', detail: 'India VIX 22.4 > 22 at the open. New entries blocked for the session.', actor: 'Risk engine' },
  { id: 'a2', day: '22 Oct', t: T(14, 31, 45), type: 'RE-ARM', rule: '2-step confirm', detail: 'Re-armed after the kill-switch drill review.', actor: 'D. Krishnan' },
  { id: 'a1', day: '22 Oct', t: T(14, 22, 10), type: 'HALT', rule: 'Kill-switch drill', detail: 'Drill: 2 orders cancelled, 1 position flat in 1.2 s. New orders locked.', actor: 'D. Krishnan' },
];

export const TODAY_AUDIT = [
  { id: 't4', day: 'Today', t: T(10, 5, 12), type: 'VETO', rule: 'Max position 25%', detail: 'Planner asked for ~40% (₹3,96,500) in LT. Order refused; resized to 65 sh (24.8%).', actor: 'Risk engine' },
  { id: 't3', day: 'Today', t: T(9, 30, 41), type: 'GATE', rule: 'Backtest gate', detail: 'SUNPHARMA RSI-2 failed: Sharpe 0.52 vs 0.66 buy-and-hold. Not traded.', actor: 'Backtest gate' },
  { id: 't2', day: 'Today', t: T(9, 15, 14), type: 'RETRY', rule: 'Tool failure', detail: 'news_sentiment: Finnhub timeout after 2.0 s. Retry 1 of 3 succeeded in 0.6 s.', actor: 'Tool runner' },
  { id: 't1', day: 'Today', t: T(9, 12, 3), type: 'BLOCK', rule: 'Paper-only allowlist', detail: 'Startup self-test: request to live endpoint api.kite.trade refused.', actor: 'Broker adapter' },
];

export const DRILLS = [
  { day: '22 Oct', t: T(14, 22, 10), by: 'D. Krishnan', what: 'Drill · 2 orders cancelled · 1 position flat', ms: 1.2 },
  { day: '15 Oct', t: T(11, 4, 52), by: 'A. Menon', what: 'Drill · 1 order cancelled · 1 position flat', ms: 1.1 },
  { day: '08 Oct', t: T(13, 30, 5), by: 'R. Iyer', what: 'Drill · broker timeout simulated · flat on retry', ms: 2.3 },
];

/** Sector-level sample headlines for the idle news triage. */
export const NEWS_POOL = [
  { sym: 'NIFTY', head: 'FII flows positive for a third session', score: 0.21, src: 'sample wire' },
  { sym: 'BPCL', head: 'Crude eases 1.2%; oil marketers in focus', score: 0.18, src: 'sample wire' },
  { sym: 'TATASTEEL', head: 'Metal index tracks softer LME copper', score: -0.22, src: 'sample wire' },
  { sym: 'MARUTI', head: 'October auto sales data due after the close', score: 0.05, src: 'sample wire' },
  { sym: 'BEL', head: 'Defence order pipeline update', score: 0.34, src: 'sample wire' },
  { sym: 'ITC', head: 'FMCG volumes steady in rural markets', score: 0.12, src: 'sample wire' },
  { sym: 'SUNPHARMA', head: 'Pharma index flat; US generics pricing stable', score: 0.03, src: 'sample wire' },
  { sym: 'HDFCBANK', head: 'Results tomorrow: earnings-week caution', score: -0.08, src: 'NSE calendar' },
];

export const AM_NEWS = [
  { id: 'n1', t: T(9, 15, 12), sym: 'INFY', head: 'Large multi-year deal announced', score: 0.62, src: 'sample wire' },
  { id: 'n2', t: T(9, 15, 12), sym: 'HDFCBANK', head: 'Results due tomorrow: earnings-week caution', score: -0.08, src: 'NSE calendar' },
  { id: 'n3', t: T(9, 15, 13), sym: 'NIFTY', head: 'FII flows positive for a third session', score: 0.21, src: 'sample wire' },
  { id: 'n4', t: T(9, 15, 13), sym: 'BPCL', head: 'Crude eases 1.2%; oil marketers in focus', score: 0.18, src: 'sample wire' },
  { id: 'n5', t: T(9, 15, 13), sym: 'SUNPHARMA', head: 'Pharma index soft for a second day', score: -0.12, src: 'sample wire' },
];

export const MIDDAY_NEWS = { id: 'n6', sym: 'IT', head: 'US lenders trim FY27 tech budgets', score: -0.48, src: 'sample wire' };

/** Why a loop ends without a trade (rotates in live mode). */
export const LOOP_CANDIDATES = [
  { sym: 'TITAN', strat: 'RSI-2', why: 'failed the backtest gate (Sharpe 0.48 vs 0.55)' },
  { sym: 'ADANIPORTS', strat: 'Breakout', why: 'volume was only 1.1× average, below the 1.5× rule' },
  { sym: 'TCS', strat: 'Trend-EMA', why: 'ADX 19 is too weak for a trend entry' },
  { sym: 'HDFCBANK', strat: 'Trend-EMA', why: 'is skipped: results are due tomorrow' },
  { sym: 'BEL', strat: 'Breakout', why: 'passed the gate, but news sentiment is −0.31' },
];

/** This morning's activity, shown in live mode (session in progress at 11:41). */
export const LIVE_FEED = [
  { t: T(9, 5, 2), kind: 'user', actor: 'You', text: 'Swing-trade NIFTY 50 today. Risk 1% a trade; stop me at −2% for the day.' },
  { t: T(9, 5, 4), kind: 'planner', status: 'done', text: 'Goal parsed into one goal and three hard limits. The limits live in the risk engine, not in my prompt.', chips: ['1% risk / trade = ₹10,000', '−2% daily loss = ₹20,000', '25% max position = ₹2,50,000'] },
  { t: T(9, 12, 3), kind: 'system', icon: 'ShieldCheck', text: 'Startup self-test passed · paper endpoint ✓ · live endpoints blocked ✓ · kill switch armed ✓' },
  { t: T(9, 14, 20), kind: 'tool', tool: 'event_calendar', args: 'NIFTY50 · next 2 days', text: 'HDFCBANK results tomorrow · F&O expiry Tue', status: 'ok', ms: 640 },
  { t: T(9, 15, 0), kind: 'system', icon: 'Bell', text: 'NSE open 09:15 · loop 1/25 started' },
  { t: T(9, 15, 6), kind: 'tool', tool: 'get_ohlcv', args: 'NIFTY50 · 15m · 60d', text: '50 symbols · 3,000 bars', status: 'ok', ms: 1180 },
  { t: T(9, 15, 14), kind: 'tool', tool: 'news_sentiment', args: '50 symbols · Haiku 5.5', text: '38 headlines triaged · 4 material · INFY +0.62', status: 'ok', ms: 2610, meta: 'retry 1 of 3 after a 2.0 s timeout' },
  { t: T(9, 15, 16), kind: 'decision', text: 'Regime → TREND · NIFTY ADX 27 · India VIX 13.2 · confidence 0.74' },
  { t: T(9, 29, 50), kind: 'planner', status: 'done', text: 'Three candidates this loop. HDFCBANK is skipped: results are due tomorrow.', list: ['INFY · Trend-EMA · ADX 31, news +0.62', 'LT · 20-day breakout · watching volume', 'SUNPHARMA · RSI-2 oversold · needs the gate'] },
  { t: T(9, 30, 12), kind: 'tool', tool: 'run_backtest', args: 'INFY · Trend-EMA · 3y', text: 'Sharpe 1.12 vs 0.61 buy-and-hold · max DD −7.8% · 41 trades → gate passed', status: 'ok', ms: 1840 },
  { t: T(9, 30, 41), kind: 'tool', tool: 'run_backtest', args: 'SUNPHARMA · RSI-2 · 3y', text: 'Sharpe 0.52 vs 0.66 buy-and-hold → gate failed · not traded', status: 'fail', ms: 1420 },
  { t: T(9, 30, 55), kind: 'tool', tool: 'run_backtest', args: 'LT · Breakout · 3y', text: 'Sharpe 0.94 vs 0.58 buy-and-hold · max DD −9.1% → gate passed', status: 'ok', ms: 1390 },
  { t: T(9, 31, 2), kind: 'tool', tool: 'size_position', args: 'INFY · entry ₹1,500 · stop ₹1,440 (2×ATR)', text: '166 sh · ₹2,49,000 (24.9%) · risk ₹9,960 (1.0%)', status: 'ok', ms: 38 },
  { t: T(9, 31, 3), kind: 'tool', tool: 'risk_check', args: 'INFY BUY 166', text: 'approved · 6 of 6 checks passed', status: 'ok', ms: 12 },
  { t: T(9, 31, 5), kind: 'tool', tool: 'place_bracket', args: 'BUY 166 INFY · SL-M ₹1,440 · TGT ₹1,620', text: 'order NX-24817 filled ₹1,500.40', status: 'ok', ms: 220 },
  { t: T(9, 31, 8), kind: 'tool', tool: 'write_journal', args: 'T-0417', text: 'written · numbers match the ledger', status: 'ok', ms: 1310 },
  { t: T(10, 5, 10), kind: 'planner', status: 'done', text: 'LT broke its 20-day high on 1.6× average volume. High conviction: requesting a 40% position.' },
  { t: T(10, 5, 12), kind: 'tool', tool: 'risk_check', args: 'LT BUY · ~40% of equity', text: 'VETO · 39.7% > 25% max position · risk 1.46% > 1%', status: 'veto', ms: 9 },
  { t: T(10, 5, 13), kind: 'tool', tool: 'size_position', args: 'LT · cap 25% · stop ₹3,672.50', text: '65 sh · ₹2,47,812 (24.8%) · risk ₹9,100 (0.91%)', status: 'ok', ms: 31 },
  { t: T(10, 5, 14), kind: 'tool', tool: 'risk_check', args: 'LT BUY 65', text: 'approved · 6 of 6 checks passed', status: 'ok', ms: 11 },
  { t: T(10, 5, 16), kind: 'tool', tool: 'place_bracket', args: 'BUY 65 LT · SL-M ₹3,672.50 · TGT ₹4,092.50', text: 'order NX-24822 filled ₹3,812.50', status: 'ok', ms: 240 },
  { t: T(10, 5, 19), kind: 'tool', tool: 'write_journal', args: 'T-0418', text: 'written · numbers match the ledger', status: 'ok', ms: 1260 },
  { t: T(10, 15, 0), kind: 'system', icon: 'Repeat', text: 'Loop 5/25 · regime TREND · no new entries' },
  { t: T(10, 30, 0), kind: 'system', icon: 'Repeat', text: 'Loop 6/25 · ADANIPORTS breakout skipped: volume 1.1× < 1.5×' },
  { t: T(10, 45, 0), kind: 'system', icon: 'Repeat', text: 'Loop 7/25 · TCS trend entry skipped: ADX 19 is too weak' },
  { t: T(11, 0, 0), kind: 'system', icon: 'Repeat', text: 'Loop 8/25 · no new entries · 2 of 4 slots used' },
  { t: T(11, 15, 0), kind: 'system', icon: 'Repeat', text: 'Loop 9/25 · TITAN RSI-2 failed the gate (Sharpe 0.48 vs 0.55)' },
  { t: T(11, 30, 0), kind: 'system', icon: 'Repeat', text: 'Loop 10/25 · no new entries · open risk ₹19,126 (1.9%)' },
  { t: T(11, 38, 40), kind: 'monitor', text: 'INFY ₹1,519.60 · SL-M ₹1,440.00 live · target ₹1,620.00 live · +0.32R' },
  { t: T(11, 40, 10), kind: 'monitor', text: 'LT ₹3,824.85 · SL-M ₹3,672.50 live · target ₹4,092.50 live · +0.09R' },
];
