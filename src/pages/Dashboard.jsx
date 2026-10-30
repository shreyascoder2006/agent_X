import { useState } from 'react';
import { useSim, useDerived } from '../store/useSim.js';
import { Chip, Ic, Panel, Rolling, Tabs, signTone } from '../components/ui/primitives.jsx';
import { EquityChart } from '../components/charts/EquityChart.jsx';
import { PriceChart } from '../components/charts/PriceChart.jsx';
import { KillSwitch, LossGauge } from '../components/trading/Guardrails.jsx';
import { PositionsTable, Watchlist } from '../components/trading/Positions.jsx';
import { OrderTicket } from '../components/trading/OrderTicket.jsx';
import { AgentStatus } from '../components/trading/AgentStatus.jsx';
import { MarketView } from '../components/trading/MarketView.jsx';
import { cx } from '../lib/cx.js';
import { inr, pct } from '../lib/format.js';

function Stat({ k, v, tone, sub }) {
  return (
    <div className="min-w-[104px] px-4 first:pl-0">
      <dt className="text-cap text-fg-3">{k}</dt>
      <dd className={cx('num text-[15px] leading-[22px]', tone || 'text-fg')}>{v}</dd>
      {sub && <dd className="text-cap text-fg-3">{sub}</dd>}
    </div>
  );
}

function tradesToday(sim) {
  const out = sim.positions.map((p) => ({ sym: p.sym, open: true, entry: p.entry, stop: p.stop, target: p.target, qty: p.qty, openedAt: p.openedAt }));
  for (const c of sim.closed) if (!out.some((o) => o.sym === c.sym)) out.push({ ...c, open: false });
  return out;
}

function Hero() {
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  const [tab, setTab] = useState('equity');
  const trades = tradesToday(sim);
  const active = trades.find((t) => t.sym === tab);
  const view = active ? tab : 'equity';
  const vsBh = d.dayPct - d.bhPct;
  const tabs = [
    { id: 'equity', node: 'Portfolio equity' },
    ...trades.map((t) => ({
      id: t.sym,
      node: (
        <>
          {t.sym}
          <span className={cx('num text-cap', t.open ? signTone(sim.universe[t.sym].p - t.entry) : 'text-fg-3')}>
            {t.open ? pct(sim.universe[t.sym].p / t.entry - 1) : t.reason === 'kill' ? 'flat' : 'closed'}
          </span>
        </>
      ),
    })),
  ];
  const markers = active
    ? [
        { kind: 'BUY', t: active.openedAt, text: `BUY ${active.qty}` },
        ...(active.open ? [] : [{ kind: active.reason === 'kill' ? 'KILL' : active.reason === 'target' ? 'TARGET' : 'STOP', t: active.closedAt, text: active.reason === 'kill' ? 'KILL' : active.reason.toUpperCase() }]),
      ]
    : [];

  return (
    <Panel hero flush className="xl:col-span-8">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 px-6 pt-5">
        <div>
          <p className="flex items-center gap-2 text-cap text-fg-3">
            Account equity <span className="num">· NX-PAPER-01</span>
          </p>
          <Rolling text={inr(d.equity, 2)} className="mt-1 text-display text-fg" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Chip tone={d.dayPnl >= 0 ? 'lime' : 'rose'} icon={d.dayPnl >= 0 ? 'TrendingUp' : 'TrendingDown'} className="num">
              {inr(d.dayPnl, 2, true)} · {pct(d.dayPct)}
            </Chip>
            <span className="text-cap text-fg-3">today</span>
            <span className="h-3 w-px bg-hair" />
            <span className="text-cap text-fg-3">
              vs NIFTY 50{' '}
              <span className={cx('num', signTone(vsBh))}>
                {vsBh >= 0 ? '+' : '−'}
                {Math.abs(vsBh * 100).toFixed(2)} pp
              </span>
            </span>
          </div>
        </div>
        <dl className="flex flex-wrap divide-x divide-hair pb-1">
          <Stat k="Realized" v={inr(d.realized, 0, true)} tone={signTone(d.realized)} />
          <Stat k="Unrealized" v={inr(d.unreal, 0, true)} tone={signTone(d.unreal)} />
          <Stat k="Exposure" v={pct(d.exposure, 1, false)} sub={`${sim.positions.length} of 4 slots`} />
          <Stat k="Open risk" v={inr(d.openRisk)} sub={pct(d.openRisk / 1e6, 2, false)} />
        </dl>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-y border-hair px-3">
        <Tabs options={tabs} value={view} onChange={setTab} label="Chart" />
        <span className="hidden items-center gap-2 pr-2 text-cap text-fg-3 md:flex">
          <Ic n="ChartCandlestick" size={13} />
          {view === 'equity' ? '1D · per minute · vs buy-and-hold' : '1D · 5m candles · NSE'}
        </span>
      </div>
      <div className="relative min-h-[280px] flex-1 px-1 pb-1 pt-1">
        {view === 'equity' ? (
          <EquityChart height="100%" className="absolute inset-0" />
        ) : (
          <PriceChart sym={view} height="100%" className="absolute inset-0" levels={{ entry: active.entry, stop: active.stop, target: active.target }} markers={markers} />
        )}
      </div>
    </Panel>
  );
}

export default function Dashboard() {
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <Hero />
      <div className="flex flex-col gap-4 xl:col-span-4">
        <AgentStatus />
        <Panel
          id="spot-gauge"
          title="Daily loss limit"
          meta="Warn 50% · block entries 75% · flatten at −2%"
          tone={d.used >= 0.75 ? 'risk' : undefined}
          actions={<Chip tone={d.used >= 0.75 ? 'rose' : d.used >= 0.5 ? 'amber' : 'green'} dot>{d.used >= 0.75 ? 'critical' : d.used >= 0.5 ? 'warning' : 'safe'}</Chip>}
          body="px-5 pb-4"
        >
          <LossGauge d={d} size={232} compact />
        </Panel>
        <Panel id="spot-kill" tone={sim.halted ? 'risk' : undefined} body="p-5">
          <KillSwitch where="dash" size={92} />
        </Panel>
      </div>

      <div className="flex flex-col gap-4 xl:col-span-8">
        <PositionsTable />
        <MarketView className="flex-1" height={320} />
      </div>
      <div className="flex flex-col gap-4 xl:col-span-4">
        <OrderTicket id="spot-ticket" />
        <Watchlist className="flex-1" />
      </div>
    </div>
  );
}
