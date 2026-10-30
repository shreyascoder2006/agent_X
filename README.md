<div align="center">

<img src="docs/screenshots/landing-hero.jpg" alt="Niyam landing page" width="100%" />

<br />

# Niyam

### An agentic paper-trading bot for NSE NIFTY 50, inside hard limits the AI cannot talk its way past.

*niyam (नियम) means **rule** in Hindi.*

<br />

![AgentX Hackathon 2026](https://img.shields.io/badge/AgentX_Hackathon-2026_·_PS--02-b8f14d?style=for-the-badge&labelColor=16181d)
![Paper trading only](https://img.shields.io/badge/Paper_trading-only-22C55E?style=for-the-badge&labelColor=16181d)
![Team](https://img.shields.io/badge/Team-Circuit_Breakers-6366F1?style=for-the-badge&labelColor=16181d)

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_3-0B1120?style=flat-square&logo=tailwindcss&logoColor=38BDF8)
![three.js](https://img.shields.io/badge/three.js_+_R3F-000000?style=flat-square&logo=threedotjs&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![TradingView Lightweight Charts](https://img.shields.io/badge/Lightweight_Charts-131722?style=flat-square&logo=tradingview&logoColor=white)
![Claude](https://img.shields.io/badge/Claude_Sonnet_5.5_·_Haiku_5.5-D97757?style=flat-square&logo=anthropic&logoColor=white)

<br />

[**Run it**](#-run-it) · [**The demo**](#-the-112-demo) · [**Guardrails**](#-guardrails-first) · [**Screens**](#-a-tour-of-the-console) · [**How it works**](#-how-it-works) · [**Stack**](#-stack)

</div>

<br />

> [!IMPORTANT]
> **Paper trading only.** Niyam never touches real money. Live broker endpoints are blocked by an allowlist, every price and backtest figure is illustrative, and nothing here is investment advice.

<br />

## ✦ What is Niyam?

Most retail traders lose to things a rulebook would stop. SEBI's study of FY22–FY24 found **93% of individual F&O traders lost money**, about ₹2 lakh each, usually through oversized positions and no stop.

Niyam is that rulebook, run by an agent. Every 15 minutes it:

<table>
<tr>
<td width="25%" valign="top">

**01 · Scan**

Bars for all 50 NIFTY stocks, the news wire (triaged by **Claude Haiku 5.5**) and the NSE event calendar.

</td>
<td width="25%" valign="top">

**02 · Reason**

Tags the regime (trend, range or volatile) from ADX and India VIX. **Claude Sonnet 5.5** picks a strategy, or decides to sit out.

</td>
<td width="25%" valign="top">

**03 · Check**

The strategy must beat buy-and-hold in a 3-year backtest. The trade is sized from **1% risk**, then six hard rules approve, resize or **veto** it.

</td>
<td width="25%" valign="top">

**04 · Act & journal**

A bracket order (stop + target) goes to a **₹10,00,000 paper account**, and a plain-language journal entry explains why.

</td>
</tr>
</table>

At **−2% for the day** it flattens everything and locks itself. A human **kill switch** halts the risk engine and the broker at once; re-arming takes two deliberate steps.

<table>
<tr>
<td width="33%"><img src="docs/screenshots/landing-problem.jpg" alt="The problem in numbers" /><p align="center"><sub><b>The problem</b> · 93% lose, 1% risk, −2% stop</sub></p></td>
<td width="33%"><img src="docs/screenshots/landing-explainable.jpg" alt="The three promises" /><p align="center"><sub><b>Three promises</b> · propose, check, explain</sub></p></td>
<td width="33%"><img src="docs/screenshots/landing-how-it-works.jpg" alt="How it works" /><p align="center"><sub><b>How it works</b> · scan, reason, check, act</sub></p></td>
</tr>
</table>

<br />

## 🛡 Guardrails first

> **The LLM proposes. Code decides.** The risk engine is plain Python with veto power over every order. No prompt can change a limit.

| Rule | Limit | What happens |
| :-- | :-- | :-- |
| Risk per trade | **≤ 1%** of start-of-day equity | Quantity = ₹10,000 ÷ stop distance |
| Position size | **≤ 25%** of equity | Bigger requests are vetoed and resized |
| Open slots | **≤ 4** | No new entries when full |
| Daily loss | **−2%** | Warn at 50%, block entries at 75%, flatten + lock at 100% |
| Earnings | No entry within 2 days of results | The candidate is skipped |
| Endpoints | **Paper only** | Live hosts (`api.kite.trade`, `api.alpaca.markets`) are refused |
| Human override | **Kill switch** | Cancel · flatten · lock, then a 2-step re-arm |

<div align="center">
<img src="docs/screenshots/landing-pillars.jpg" alt="Guardrails: risk engine, backtest gate, kill switch and journal" width="100%" />
</div>

<br />

## ▶ The 1:52 demo

Press **Run demo** and Niyam replays a scripted session from **Fri 30 Oct 2026**, a crash into the close, built for a 3-minute hackathon video. Broadcast-style captions narrate each beat, and a spotlight dims the page to lift the panel that matters.

| | Beat | What you see |
| :--: | :-- | :-- |
| **1** | **Goal** · 0:00 | The trader types the job in plain words; Niyam turns it into one goal and three hard limits. |
| **2** | **Plan** · 0:07 | It scans 50 stocks, triages the news, tags the regime and runs every candidate through the backtest gate. |
| **3** | **Act** · 0:30 | INFY is sized from 1% risk, approved and bought with a bracket order. An oversized LT request is **vetoed** and resized. |
| **4** | **Re-plan** · 0:53 | A midday news shock flips the regime to volatile. Niyam pauses new entries and trims a target. No stop is loosened. |
| **5** | **Limit** · 1:09 | A sell-off fires the LT stop and the loss gauge climbs toward −2%. **Press the kill switch**, or it auto-presses at 1:26. |
| **6** | **Result** · 1:35 | The day's loss stayed inside −2% while buy-and-hold fell further, followed by the 4-year backtest. |

On the replay day Niyam closes at **−1.83%** while buy-and-hold NIFTY 50 falls **−2.64%**: one stop hit, one veto, one kill-switch halt, and peak use of 91% of the daily limit.

<table>
<tr>
<td width="50%"><img src="docs/screenshots/demo-intro.jpg" alt="Demo intro card" /><p align="center"><sub><b>Intro card</b> · the replay waits behind it</sub></p></td>
<td width="50%"><img src="docs/screenshots/demo-act.jpg" alt="Act beat: pre-trade check spotlighted" /><p align="center"><sub><b>Act</b> · the order ticket in the spotlight</sub></p></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/demo-veto.jpg" alt="Risk engine veto" /><p align="center"><sub><b>Veto</b> · the planner's LT order risked 1.46% &gt; 1%, so code resized it</sub></p></td>
<td width="50%"><img src="docs/screenshots/demo-replan.jpg" alt="Re-plan after the news shock" /><p align="center"><sub><b>Re-plan</b> · regime flips to volatile</sub></p></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/demo-kill-cue.jpg" alt="Kill switch cue" /><p align="center"><sub><b>Limit</b> · the kill switch cue</sub></p></td>
<td width="50%"><img src="docs/screenshots/demo-halted.jpg" alt="Trading halted" /><p align="center"><sub><b>Halted</b> · cancel, flatten, lock</sub></p></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/demo-result.jpg" alt="Replay result on the backtest view" /><p align="center"><sub><b>Result</b> · loss held inside the limit</sub></p></td>
<td width="50%"><img src="docs/screenshots/demo-outro.jpg" alt="Outro card with the session result" /><p align="center"><sub><b>Outro</b> · the numbers that matter</sub></p></td>
</tr>
</table>

<br />

## 🖥 A tour of the console

### Live dashboard

Account equity with rolling digits, a TradingView-grade chart (portfolio equity against buy-and-hold with the −2% halt line, or each position's candles with entry, stop and target), the agent's live LangGraph node, a precision loss gauge and a physical kill switch.

<img src="docs/screenshots/dashboard.jpg" alt="Live dashboard" width="100%" />

<table>
<tr>
<td width="50%"><img src="docs/screenshots/dashboard-lower.jpg" alt="Positions, order ticket and watchlist" /><p align="center"><sub><b>Positions, order ticket, watchlist</b> · sparklines on every row</sub></p></td>
<td width="50%"><img src="docs/screenshots/heatmap.jpg" alt="NIFTY 50 sector heatmap" /><p align="center"><sub><b>Market heatmap</b> · NIFTY 50 by sector, sized by index weight</sub></p></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/instrument-drawer.jpg" alt="Instrument drawer" /><p align="center"><sub><b>Instrument drawer</b> · candles, depth, risk math, the agent's reasoning, order legs</sub></p></td>
<td width="50%"><img src="docs/screenshots/command-palette.jpg" alt="Command palette" /><p align="center"><sub><b>Command palette</b> · <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>K</kbd> to jump, run the demo or halt</sub></p></td>
</tr>
</table>

### The other five views

<table>
<tr>
<td width="50%"><img src="docs/screenshots/activity.jpg" alt="Agent activity" /><p align="center"><sub><b>Agent activity</b> · reasoning feed, tool calls, models, news triage</sub></p></td>
<td width="50%"><img src="docs/screenshots/journal.jpg" alt="Trade journal" /><p align="center"><sub><b>Trade journal</b> · the why behind every trade</sub></p></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/backtest.jpg" alt="Backtest report" /><p align="center"><sub><b>Backtest report</b> · Niyam vs buy-and-hold, 2022–2025</sub></p></td>
<td width="50%"><img src="docs/screenshots/risk.jpg" alt="Risk and guardrails" /><p align="center"><sub><b>Risk &amp; guardrails</b> · limits, allowlist, kill switch, audit log</sub></p></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/architecture.jpg" alt="3D agent architecture" /><p align="center"><sub><b>Architecture</b> · the live pipeline in 3D: Ingest → Reason → Risk engine → Paper broker → Journal</sub></p></td>
</tr>
</table>

> [!NOTE]
> The console screenshots show the visual upgrade from the [`feat/visual-upgrade`](https://github.com/shreyascoder2006/agent_X/tree/feat/visual-upgrade) branch. `main` has the landing page and the original console; the upgrade lands on `main` when that branch is merged.

<br />

## ⚙ How it works

```mermaid
flowchart LR
    subgraph Ingest
      A[NSE OHLCV<br/>15-min + daily] --> S
      N[News wire<br/>Claude Haiku 5.5] --> S
      E[Event calendar] --> S
    end
    S((SCAN)) --> R[REGIME<br/>ADX · India VIX]
    R --> P[SELECT<br/>Claude Sonnet 5.5]
    P --> B[BACKTEST GATE<br/>must beat buy-and-hold]
    B --> Z[SIZE<br/>1% risk ÷ stop]
    Z --> K{RISK ENGINE<br/>6 hard checks}
    K -- approve --> O[ORDER<br/>bracket · paper broker]
    K -- veto / resize --> Z
    O --> M[MONITOR<br/>stops · targets · −2% day]
    M --> J[JOURNAL<br/>plain language, checked vs ledger]
    H([Human kill switch]) -. halt .-> K
    H -. halt .-> O
```

| Piece | What it does |
| :-- | :-- |
| **Planner** | A LangGraph state machine. Claude Sonnet 5.5 proposes setups and writes the journal; it re-plans on a stop hit, a news shock, a regime flip or a tool error. |
| **News triage** | Claude Haiku 5.5 scores headlines from −1 to +1 and flags the material ones. |
| **Backtest gate** | vectorbt over 3 years; a strategy only trades if it beats buy-and-hold on Sharpe. |
| **Risk engine** | Plain Python with **zero LLM calls**. It holds the only (paper) broker keys. |
| **Memory** | Within a task: LangGraph state. Across tasks: a Postgres ledger plus Qdrant, so the planner sees the 3 most similar past setups. |

<details>
<summary><b>The four playbooks</b></summary>
<br />

| Strategy | Rule | Regime |
| :-- | :-- | :-- |
| **Trend-EMA** | 20/50 EMA cross with ADX > 25 | Trend |
| **RSI-2** | RSI(2) < 10 above the 200-day average | Range |
| **Breakout** | 20-day high on 1.5× average volume | Trend |
| **Sit out** | India VIX > 16 intraday or > 22 at the open | Volatile |

Four-year illustrative backtest (NIFTY 50 universe, Jan 2022 – Dec 2025, ₹10 L start): 212 trades, 54% win rate, profit factor 1.62.

</details>

<details>
<summary><b>The rules, as code</b></summary>
<br />

```python
# risk_engine/rules.py  ·  hard-coded, not promptable
MAX_RISK_PER_TRADE = 0.01      # of start-of-day equity
MAX_POSITION       = 0.25
MAX_OPEN_SLOTS     = 4
DAILY_LOSS_LIMIT   = 0.02
LIVE_HOSTS         = {"api.kite.trade", "api.alpaca.markets"}

def check(order, book):
    if order.host in LIVE_HOSTS:
        return veto("live endpoint blocked")
    if order.risk > MAX_RISK_PER_TRADE * book.start_equity:
        return veto("risk per trade > 1%")
    if order.value > MAX_POSITION * book.equity:
        return veto("position > 25%")
    if len(book.open) >= MAX_OPEN_SLOTS:
        return veto("no free slot")
    if book.day_pnl <= -DAILY_LOSS_LIMIT * book.start_equity:
        flatten_all(); lock()
        return veto("daily loss limit")
    return approve()
```

</details>

<br />

## 🚀 Run it

```bash
git clone https://github.com/shreyascoder2006/agent_X.git
cd agent_X
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # static build in dist/, runs from any static host
npm run preview      # serve the build
```

The app opens on the landing page (`#home`). Choose **Open the live console**, or **Watch the 1:52 replay**. Everything runs in the browser: the market, the agent and the broker are simulated, so there are no keys to set and nothing to deploy.

| Route | View |
| :-- | :-- |
| `#home` | Landing page |
| `#dashboard` | Live dashboard |
| `#activity` | Agent activity |
| `#journal` | Trade journal |
| `#backtest` | Backtest report |
| `#risk` | Risk & guardrails |
| `#architecture` | Architecture (3D) |

<br />

## 🧱 Stack

**React 18** · **Vite 5** · **React Router 6** (MemoryRouter with a plain `#view` hash, so it runs on any static host) · **Zustand + Immer** · **Tailwind CSS 3** · **Framer Motion** · **Recharts** · **TradingView Lightweight Charts** · **three.js** with **React Three Fiber** and **drei** · **lucide-react**

```
src/
  sim/          simulation engine: live session, scripted replay, guardrails, kill switch
  store/        zustand store and the 5 Hz engine loop
  landing/      the landing page (#home)
  pages/        the six console views
  components/   layout shell, trading widgets, 3D scenes, UI primitives
  data/         universe, journal history, backtest series, agent vocabulary
```

<br />

<div align="center">

### Team Circuit Breakers · AgentX Hackathon 2026 · PS-02

*Rules, not hunches.*

<sub>Paper trading only · illustrative data · not investment advice · charts by <a href="https://www.tradingview.com/">TradingView Lightweight Charts™</a></sub>

</div>
