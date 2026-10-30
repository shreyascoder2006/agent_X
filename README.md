# Niyam Agent Console

Front-end prototype of **Niyam**, an agentic paper-trading bot, built for the AgentX Hackathon 2026 demo round
(PS-02: Agentic trading bot). Team **Circuit Breakers**.

Niyam reads NSE prices and news, tags the market regime, picks a backtested strategy (Trend-EMA, RSI-2,
breakout or sit out), sizes every trade from a 1% risk budget, places bracket orders in a ₹10,00,000 paper
account, halts itself at a −2% daily loss, and writes a plain-language journal entry for every trade.
A human kill switch halts the risk engine and the broker at once.

All data is simulated in the browser. Paper trading only; prices and backtest figures are illustrative.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/, runs from any static host
npm run preview    # serve the build
```

## The six views

| Route | View | What it shows |
| --- | --- | --- |
| `#dashboard` | Live Dashboard | Paper equity, day P&L, equity curve vs buy-and-hold, loss-limit gauge, kill switch, positions, regime dial, 3D universe scan, pre-trade risk check, working orders |
| `#activity` | Agent Activity | Live reasoning feed with colour-coded tool calls, LangGraph loop stepper, tool-call stats, model usage, news triage |
| `#journal` | Trade Journal | One card per trade: the plain-language reason next to the structured facts, notes, lessons, R-multiples |
| `#backtest` | Backtest Report | Niyam vs buy-and-hold (NIFTY 50, 2022–2025) by strategy and range, drawdowns, monthly heatmap, replay result |
| `#risk` | Risk & Guardrails | Daily-loss gauge, rule cards, paper-only allowlist, kill switch with 2-step re-arm, P&L vs limit, audit log, rules as code |
| `#architecture` | Architecture | Interactive 3D pipeline (Ingest → Reason → Risk engine → Paper broker → Journal) with live status and stage details |

## Demo mode

**Run Demo** (top right) replays a scripted 1:52 session for the 3-minute video:

1. **Goal** (0:00) – the trader types the goal; Niyam sets three hard limits.
2. **Plan** (0:07) – scan 50 stocks, triage news, tag the regime, run the backtest gate.
3. **Act** (0:30) – size INFY from 1% risk, risk-check, bracket order, journal; an oversized LT order is vetoed and resized.
4. **Re-plan** (0:53) – a midday news shock flips the regime to volatile; Niyam pauses entries and trims a target.
5. **Limit** (1:09) – a sell-off fires the LT stop and pushes the loss gauge past 90%; press the kill switch (it auto-presses at 1:26 if you don't).
6. **Result** (1:35) – the day's loss stays inside −2% while buy-and-hold falls further; the 4-year backtest follows.

Auto-follow switches views as the story moves; click any view to take over (the next view pulses instead).
Pause, Restart, Captions and Exit sit in the bar at the bottom. When the replay ends the app returns to the live session.

## Stack

React 18 · Vite 5 · React Router 6 · Zustand + Immer · Tailwind CSS 3 · Recharts 2 · lucide-react ·
three.js with React Three Fiber and drei.

```
src/
  sim/          simulation engine: live session, scripted replay, guardrails, kill switch
  store/        zustand store and the 5 Hz engine loop
  pages/        the six views
  components/   layout shell, trading widgets, 3D scenes, UI primitives
  data/         universe, journal history, backtest series, agent vocabulary
```
