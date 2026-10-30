// Product structure and agent vocabulary shared across the app.

export const NAV = [
  { id: 'dashboard', label: 'Live Dashboard', short: 'Command center', icon: 'LayoutDashboard', title: 'Live dashboard' },
  { id: 'activity', label: 'Agent Activity', short: 'Reasoning + tool calls', icon: 'BrainCircuit', title: 'Agent activity' },
  { id: 'journal', label: 'Trade Journal', short: 'Why every trade', icon: 'NotebookPen', title: 'Trade journal' },
  { id: 'backtest', label: 'Backtest Report', short: 'vs buy-and-hold', icon: 'ChartLine', title: 'Backtest report' },
  { id: 'risk', label: 'Risk & Guardrails', short: 'Limits + kill switch', icon: 'ShieldCheck', title: 'Risk and guardrails' },
  { id: 'architecture', label: 'Architecture', short: 'Live 3D pipeline', icon: 'Network', title: 'Agent architecture' },
];

export const LIMITS = {
  riskPerTrade: 0.01,
  maxPosition: 0.25,
  slots: 4,
  dailyLoss: 0.02,
};

export const TOOL_META = {
  get_ohlcv: { tone: 'indigo', icon: 'ChartCandlestick', stage: 'ingest', node: 'SCAN', returns: '15-min + daily candles' },
  news_sentiment: { tone: 'amber', icon: 'Newspaper', stage: 'ingest', node: 'SCAN', returns: 'score −1…+1, headline' },
  event_calendar: { tone: 'sky', icon: 'CalendarClock', stage: 'ingest', node: 'SCAN', returns: 'results, expiry, RBI dates' },
  run_backtest: { tone: 'violet', icon: 'FlaskConical', stage: 'reason', node: 'BACKTEST', returns: 'Sharpe, max DD vs B&H' },
  size_position: { tone: 'teal', icon: 'Calculator', stage: 'risk', node: 'SIZE', returns: 'qty from 1% risk ÷ stop' },
  risk_check: { tone: 'acid', icon: 'ShieldCheck', stage: 'risk', node: 'RISK', returns: 'approve / veto + reason' },
  place_bracket: { tone: 'green', icon: 'Send', stage: 'broker', node: 'ORDER', returns: 'paper order ID, fill' },
  write_journal: { tone: 'zinc', icon: 'NotebookPen', stage: 'journal', node: 'JOURNAL', returns: 'plain-language entry' },
};
export const TOOLS = Object.keys(TOOL_META);

/** LangGraph nodes, in loop order. */
export const NODES = ['SCAN', 'REGIME', 'SELECT', 'BACKTEST', 'SIZE', 'RISK', 'ORDER', 'MONITOR', 'JOURNAL'];
export const NODE_INFO = {
  SCAN: { kind: 'code', desc: 'Bars, news and the event calendar for 50 stocks' },
  REGIME: { kind: 'code', desc: 'Trend, range or volatile from ADX and India VIX' },
  SELECT: { kind: 'llm', desc: 'Claude Sonnet 5.5 picks a strategy or sits out' },
  BACKTEST: { kind: 'code', desc: '3-year test must beat buy-and-hold' },
  SIZE: { kind: 'code', desc: 'qty = 1% risk ÷ stop distance, capped at 25%' },
  RISK: { kind: 'veto', desc: 'Hard rules approve or veto. Not promptable' },
  ORDER: { kind: 'code', desc: 'Bracket order to the paper broker' },
  MONITOR: { kind: 'code', desc: 'Stops, targets and the −2% day limit' },
  JOURNAL: { kind: 'llm', desc: 'Plain-language entry, checked against the ledger' },
};

/** Pipeline stages shown on the architecture view. */
export const STAGES = [
  {
    id: 'ingest',
    name: 'Ingest',
    icon: 'ChartCandlestick',
    color: '#818CF8',
    what: 'Pulls 15-minute and daily bars for 50 NIFTY stocks, the news wire and the NSE event calendar.',
    powered: ['NSE OHLCV · 15-min + daily', 'News RSS + Finnhub', 'NSE event calendar', 'Claude Haiku 5.5 · news triage'],
    tools: ['get_ohlcv', 'news_sentiment', 'event_calendar'],
  },
  {
    id: 'reason',
    name: 'Reason',
    icon: 'BrainCircuit',
    color: '#6366F1',
    what: 'A LangGraph state machine. Claude Sonnet 5.5 proposes, code nodes decide. Tags the regime, picks a strategy and runs the backtest gate.',
    powered: ['LangGraph (Python)', 'Claude Sonnet 5.5 · planner + journal', 'Regime detector · ADX, India VIX', 'vectorbt backtester'],
    tools: ['run_backtest'],
  },
  {
    id: 'risk',
    name: 'Risk engine',
    icon: 'ShieldCheck',
    color: '#C6FF00',
    what: 'Hard-coded Python rules with veto power over every order. The LLM cannot change them.',
    powered: ['Python rules · not promptable', '1% risk · 25% position · 4 slots', '−2% daily loss → flatten + lock', 'Human kill switch'],
    tools: ['size_position', 'risk_check'],
  },
  {
    id: 'broker',
    name: 'Paper broker',
    icon: 'Landmark',
    color: '#22C55E',
    what: 'Places bracket orders (stop + target) in a paper account. Live endpoints are blocked by an allowlist.',
    powered: ['NiyamEx mock exchange', 'Alpaca Paper API adapter', 'Paper-only endpoint allowlist'],
    tools: ['place_bracket'],
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: 'NotebookPen',
    color: '#16A34A',
    what: 'Writes a plain-language entry for every trade and checks its numbers against the ledger.',
    powered: ['Postgres trade ledger', 'Qdrant · similar past setups', 'This console'],
    tools: ['write_journal'],
  },
];
export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s]));

export const STRATEGIES = {
  'Trend-EMA': { tone: 'acid', rule: '20/50 EMA cross with ADX > 25', regime: 'TREND' },
  'RSI-2': { tone: 'indigo', rule: 'RSI(2) < 10 above the 200-day average', regime: 'RANGE' },
  Breakout: { tone: 'green', rule: '20-day high on 1.5× average volume', regime: 'TREND' },
  'Sit out': { tone: 'amber', rule: 'India VIX > 16 intraday or > 22 at the open', regime: 'VOLATILE' },
};

export const REGIMES = {
  RANGE: { tone: 'indigo', color: '#818CF8', play: 'RSI-2 mean reversion' },
  TREND: { tone: 'acid', color: '#C6FF00', play: 'Trend-EMA and breakouts' },
  VOLATILE: { tone: 'amber', color: '#F59E0B', play: 'Sit out new entries' },
  'PRE-OPEN': { tone: 'zinc', color: '#71717A', play: 'Waiting for the open' },
};

export const AUDIT_TONE = {
  VETO: 'rose',
  HALT: 'rose',
  BLOCK: 'amber',
  GATE: 'violet',
  RETRY: 'sky',
  LIMIT: 'amber',
  'SIT-OUT': 'indigo',
  'RE-ARM': 'acid',
};

export const ENDPOINTS = [
  { host: 'paper.niyamex.local', role: 'NiyamEx mock exchange', ok: true },
  { host: 'paper-api.alpaca.markets', role: 'Alpaca paper trading', ok: true },
  { host: 'api.alpaca.markets', role: 'Alpaca live trading', ok: false },
  { host: 'api.kite.trade', role: 'Zerodha Kite live', ok: false },
];
