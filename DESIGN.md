# Niyam Agent Console · design notes

## Art direction: "precision instrument at night"

Niyam should feel like a tool a desk keeps open all day: layered graphite surfaces, crisp hairlines and one
disciplined accent. Data is the hero, so chrome recedes: panels are quiet, titles are sentence case and the
interface spends colour only where a number needs it. Lime means *now* and *positive*; rose means *risk* and
is the only colour allowed to get loud. Indigo is the agent's voice (anything an LLM wrote or decided), green
is the broker (fills, healthy endpoints), amber is a warning. Motion is short and physical: numbers roll,
ticks tint for 400 ms, panels settle on springs, and the kill switch is the one moment the whole screen reacts.

References: TradingView and Zerodha Kite for chart density and order tickets, Linear and Vercel for surfaces,
type and motion, LangSmith and Datadog APM for the trace waterfall.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#07080A` | page |
| `panel` | `#0D0F12` | default panel |
| `raised` | `#12151A` | hero panels, inputs, table headers |
| `overlay` | `#181C22` | popovers, menus, tooltips, drawer cards |
| `hair` | `rgba(255,255,255,.06)` | default 1px borders and dividers |
| `line` | `rgba(255,255,255,.10)` | strong borders, focused rows |
| inner highlight | `inset 0 1px 0 rgba(255,255,255,.04)` | top edge of every panel |
| `shadow-panel` | `0 12px 32px -12px rgba(0,0,0,.6)` | panels |
| `shadow-hero` | panel shadow + `0 24px 48px -24px rgba(0,0,0,.7)` | hero panel, one elevation higher |
| `fg` | `#ECEEF1` | primary text |
| `fg2` | `#A3A9B3` | secondary text |
| `fg3` | `#80868F` | tertiary text (see contrast note) |
| `mute` | `#6C727C` | icons, disabled, tick marks (not body text) |
| `lime` | `#C6FF00` | primary CTA, live dots, selected nav, the single "now" mark, positive P&L text |
| `rose` | `#F43F5E` (text `#FB7185`) | down, stops, vetoes, halt |
| `indigo` | `#6366F1` (text `#818CF8`) | agent / LLM |
| `green` | `#16A34A` (text `#22C55E`) | broker, fills, healthy |
| `amber` | `#F59E0B` | warnings |

Contrast: the brief's tertiary `#6C727C` measures 3.96:1 on `panel`, under AA for 13px text. Text uses
`#80868F` instead (5.2:1 on panel, 5.0:1 on raised, 4.7:1 on overlay); `#6C727C` stays as `mute` for
icons and rules. Indigo and rose fills keep their brand values; their text tints are the lighter steps
above (6.4:1 and 5.9:1).

Lime budget: lime is never a fill larger than a button. Tints are 6–12% at most, candle bodies are 85%,
and every view is checked to keep lime under 5% of its pixels.

Background: the grid and radial glows are gone. The page is flat `bg` with a fixed vignette and a 2–3% film
grain (inline SVG `feTurbulence` data URI). Glass blur is reserved for the demo bar, the command palette and
drawers.

## Type and spacing

Geist for UI. Geist Mono only for prices, quantities, IDs and timestamps, always with
`font-variant-numeric: tabular-nums slashed-zero`.

| Step | Size / line | Weight | Use |
| --- | --- | --- | --- |
| `display` | 44 / 48, −0.02em | 600 | hero equity |
| `h1` | 22 / 28, −0.01em | 600 | view title |
| `h2` | 15 / 22 | 600 | panel title (sentence case) |
| `body` | 13 / 20 | 400 | default |
| `cap` | 12 / 16 | 400–500 | labels, meta |
| `tick` | 11 / 14 | 500 | chart axis ticks only |

Uppercase overlines are rare (status stamps, the receipt) and tiny. Spacing is on an 8-pt grid: panel padding
20, gaps 16 inside a section, 24 between sections, 12-column grid. Panels stretch to their row and their
content fills them; no panel leaves dead space at the bottom.

## Component inventory

Shell
- `Sidebar`: workspace switcher (Circuit Breakers), nav with a lime indicator that glides between items
  (`layoutId`), agent mini status, compact kill switch.
- `TopBar`: breadcrumb and view title, command trigger (`Ctrl/⌘ K`), NSE status, LIVE/REPLAY, Run demo
  (the one lime button), notifications bell with toast history, account menu `NX-PAPER-01 · Paper`, avatar.
- `IndexStrip`: NIFTY 50, India VIX, breadth, then a calm ticker tape.
- `StatusBar` (IDE style): `NiyamEx paper · ws 38 ms`, `last tick 0.2 s`, `Sonnet 5.5 · p50 1.2 s`,
  `Risk engine armed`, IST clock, `illustrative data` badge (replaces banners).
- `CommandPalette` (cmdk): views, Run demo / Pause / Restart / Exit, journal entries, instruments, kill
  switch with a confirm step.
- `HaltStrip` + `HaltFX`: slim rose strip with the 2-step re-arm; on halt a rose pulse around the screen
  edge and a `HALTED` stamp; on re-arm a lime sweep.
- `Toasts`, `Notifications` popover, `Skeleton` overlays (first load and route change).

Primitives
- `Panel` (+ `hero` elevation, `tone="risk"`), `PanelHeader` (sentence-case title, optional meta and actions),
  `Chip`, `Dot`, `Kbd`, `Monogram`, `Ledger` rows with dotted leaders, `Segmented` with a gliding thumb,
  `Toggle`, `Tip`, `Spark`, `Rolling` (digit-by-digit number), `Tick` (8% tint flash), `DrawIn` (one-time
  chart reveal), `Empty` states.

Trading
- `PriceChart` (lightweight-charts): candles + volume, crosshair OHLC legend, IST time scale, BUY / STOP /
  KILL markers, entry (white dashed), stop (rose), target (lime) price lines.
- `EquityChart` (lightweight-charts baseline series): portfolio vs buy-and-hold, −2% halt price line, markers.
- `HeroChart`: tabs for portfolio equity and each position's candles.
- `PositionsTable` and `Watchlist` with sparklines; rows open the instrument drawer.
- `OrderTicket`: the pre-trade check as a receipt (perforated edges, dotted leaders, verdict stamp).
- `LossGauge`: thin precision arc, minor/major ticks, needle.
- `KillSwitch`: recessed bezel, physical press, rose glow.
- `InstrumentDrawer`: candles with entry/stop/target, 5-level ladder, journal reasoning, news chips,
  risk math, order-leg timeline with brokerage + STT.
- `MarketView`: 3D columns or a NIFTY 50 sector treemap.
- `TraceExplorer`: loop list, span waterfall (LLM indigo, tools by colour, vetoes rose), JSON inspector.
- `JournalEntry`: editorial article, pull quote, side ledger, candle thumbnail, notes timeline.
- `RuleDial`, `AclTable`, `AuditTimeline`, `RulesCode` (fires highlight the rule's lines).

3D
- Market: one `InstancedMesh` of rounded columns grouped by sector on a low-strength reflective floor,
  Lightformer environment (no HDR downloads), lime light pillars on held names, a scan light sheet, hover
  lift, camera dolly-in.
- Pipeline: glass plinths (transmission 0.4, roughness 0.25, clearcoat) with emissive rims and icon badges,
  glowing tubes with an animated dash, packets with trails, click-to-fly camera, rose flood + shockwave on halt.
- Post: bloom on emissive parts only (luminance threshold 1), SMAA, light vignette and noise; dpr [1, 1.75],
  render paused when off-screen or the tab is hidden, 2D fallback without WebGL.

Demo
- `LowerThird` (step chip + one line), `DemoControls` (glass bar), `Spotlight` (dims the page to ~40% and lifts
  the panel that matters with a soft lime ring), `DemoIntro` (3 s branded card; the replay is paused under it,
  so script timings are unchanged), `DemoOutro` (result numbers).

## Dashboard: before → after

| | Before | After |
| --- | --- | --- |
| Row 1 | Six equal KPI cards with icon chips and 11px uppercase labels | One hero (8 cols): equity in 44px rolling digits, day P&L chip, vs-NIFTY delta, four quiet sub-stats, and a TradingView-grade chart with tabs (portfolio equity · each position's candles) |
| Right rail | Guardrails card (gauge + kill switch + 4 lime chips) | Stack of three: agent status (live node, loop progress), the precision loss gauge, the physical kill switch |
| Row 2 | Positions table + regime card | Positions table with sparklines (rows open the drawer), watchlist with sparklines, pre-trade check as an order receipt |
| Row 3 | 3D universe card, pre-trade check, orders, agent feed | Market view with a 3D / Heatmap toggle (NIFTY 50 sector treemap) and a regime + working-orders side panel |
| Colour | Lime on every tile, chip, toggle and bar | Lime only on Run demo, live dots, the nav indicator, the chart's "now" mark and positive P&L |
| Charts | Recharts area chart, no candles | lightweight-charts candles + volume, crosshair OHLC legend, entry/stop/target lines, BUY/STOP/KILL markers |
| Chrome | Header + marquee | Top bar with command palette, notifications, account; index strip; IDE status bar |

At 1440×900 and 1920×1080 the hero row (equity, chart, gauge, kill switch) fits above the fold; during the
replay the spotlight scrolls the panel that matters into view above the lower third.
