import { useSim, useDerived } from '../store/useSim.js';
import { Card, Flash, Ic, Money, Pill, Spark, Tilt, Tip, Bar, limitColor } from '../components/ui/primitives.jsx';
import { EquityChart } from '../components/trading/EquityChart.jsx';
import { KillSwitch, LossGauge } from '../components/trading/Guardrails.jsx';
import { OrdersList, PositionsTable } from '../components/trading/Positions.jsx';
import { AgentNow, PreTradeCheck, RegimeCard } from '../components/trading/Agent.jsx';
import UniverseScene from '../components/three/UniverseScene.jsx';
import { cx } from '../lib/cx.js';
import { inr, pct } from '../lib/format.js';

function Kpi({ label, icon, hint, className, children, foot }) {
  return (
    <Tilt className={cx('rounded-xl border border-line bg-card p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          <Ic n={icon} size={13} />
          {label}
        </span>
        {hint && (
          <Tip text={hint} align="right">
            <Ic n="Info" size={13} className="cursor-help text-zinc-600 hover:text-zinc-300" />
          </Tip>
        )}
      </div>
      <div className="mt-2">{children}</div>
      {foot && <div className="mt-3">{foot}</div>}
    </Tilt>
  );
}

function KpiRow() {
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  const series = [...sim.curve.slice(-120).map((p) => p.eq), d.equity];
  const vsBh = d.dayPct - d.bhPct;
  const slots = Array.from({ length: 4 }, (_, i) => i < sim.positions.length);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      <Kpi label="Paper equity" icon="Wallet" className="col-span-2" hint="Cash plus positions marked to the last price. Paper money only.">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Money v={d.equity} className="text-[28px] font-semibold leading-none text-zinc-50" />
            <div className="mt-2 flex items-center gap-2">
              <Pill tone={d.dayPnl >= 0 ? 'acid' : 'rose'} icon={d.dayPnl >= 0 ? 'TrendingUp' : 'TrendingDown'}>
                {inr(d.dayPnl, 2, true)} · {pct(d.dayPct)}
              </Pill>
              <span className="text-[11px] text-zinc-500">from ₹10,00,000</span>
            </div>
          </div>
          <div className="w-full max-w-[220px] flex-1">
            <Spark data={series} baseline={1e6} height={46} color={d.dayPnl >= 0 ? '#C6FF00' : '#F43F5E'} />
          </div>
        </div>
      </Kpi>
      <Kpi label="Day P&L" icon="Activity" hint="Realized from closed trades plus unrealized on open positions.">
        <Money v={d.dayPnl} sign className={cx('text-xl font-semibold', d.dayPnl >= 0 ? 'text-acid' : 'text-rose-400')} />
        <div className="mt-3 space-y-1 text-[11px]">
          <div className="flex justify-between text-zinc-500">
            <span>realized</span>
            <span className={cx('font-mono tnum', d.realized >= 0 ? 'text-zinc-300' : 'text-rose-300')}>{inr(d.realized, 0, true)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>unrealized</span>
            <span className={cx('font-mono tnum', d.unreal >= 0 ? 'text-zinc-300' : 'text-rose-300')}>{inr(d.unreal, 0, true)}</span>
          </div>
        </div>
      </Kpi>
      <Kpi label="vs NIFTY 50" icon="Scale" hint="Today's return against ₹10 L put into NIFTY 50 at the 09:15 open.">
        <p className={cx('font-mono text-xl font-semibold tnum', vsBh >= 0 ? 'text-acid' : 'text-rose-400')}>
          {vsBh >= 0 ? '+' : '−'}
          {Math.abs(vsBh * 100).toFixed(2)} pp
        </p>
        <div className="mt-3 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-500">Niyam</span>
            <span className={cx('font-mono tnum', d.dayPct >= 0 ? 'text-acid' : 'text-rose-300')}>{pct(d.dayPct)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-500">NIFTY 50</span>
            <span className={cx('font-mono tnum', d.bhPct >= 0 ? 'text-zinc-300' : 'text-rose-300')}>{pct(d.bhPct)}</span>
          </div>
        </div>
      </Kpi>
      <Kpi label="Exposure" icon="Layers" hint="Value of open positions as a share of equity. Max 25% per position, 4 slots.">
        <p className="font-mono text-xl font-semibold text-zinc-100 tnum">
          <Flash v={Math.round(d.exposure * 1000)}>{pct(d.exposure, 1, false)}</Flash>
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          {slots.map((on, i) => (
            <span key={i} className={cx('h-2 flex-1 rounded-full transition-colors duration-300', on ? 'bg-acid shadow-glowsm' : 'bg-white/[0.07]')} />
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-500">
          {sim.positions.length} of 4 slots · open risk <span className="font-mono text-zinc-300 tnum">{inr(d.openRisk)}</span>
        </p>
      </Kpi>
      <Kpi label="Headroom" icon="ShieldCheck" hint="How far the day can fall before the −2% limit flattens everything and locks trading.">
        <p className="font-mono text-xl font-semibold tnum" style={{ color: limitColor(d.used) }}>
          {inr(Math.max(0, d.headroom))}
        </p>
        <Bar className="mt-3" value={d.used} color={limitColor(d.used)} />
        <p className="mt-1.5 text-[11px] text-zinc-500">
          {Math.round(d.used * 100)}% of the ₹20,000 day limit used
        </p>
      </Kpi>
    </div>
  );
}

export default function Dashboard() {
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  return (
    <div className="space-y-4">
      <KpiRow />

      <div className="grid gap-4 xl:grid-cols-12">
        <Card
          className="flex flex-col xl:col-span-8"
          title="Equity today"
          icon="ChartArea"
          sub="Niyam vs ₹10 L in NIFTY 50 from the open · −2% halt line"
          right={
            <div className="hidden items-center gap-3 text-[11px] text-zinc-400 sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm bg-acid" /> Niyam
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0 w-3 border-t border-dashed border-zinc-400" /> Buy-and-hold
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0 w-3 border-t border-dashed border-rose-400" /> −2% halt
              </span>
            </div>
          }
          body="flex-1 px-2 pb-3"
        >
          <EquityChart height={300} fill />
        </Card>
        <Card className="xl:col-span-4" title="Guardrails" icon="ShieldCheck" tone={sim.halted ? 'rose' : undefined} right={<Pill tone={sim.halted ? 'rose' : 'acid'} dot pulse>{sim.halted ? 'Halted' : 'Armed'}</Pill>}>
          <LossGauge d={d} size={300} />
          <div className="mt-3 rounded-xl border border-line bg-panel p-3">
            <KillSwitch where="dash" />
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            {[
              ['Target', '1% risk / trade'],
              ['Layers', '25% max position'],
              ['Boxes', '4 open slots'],
              ['Lock', 'Paper endpoints only'],
            ].map(([icon, t]) => (
              <li key={t} className="flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-2 text-zinc-300">
                <Ic n={icon} size={13} className="text-acid" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <PositionsTable className="xl:col-span-8" />
        <RegimeCard className="xl:col-span-4" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <Card
          className="flex flex-col lg:col-span-2 xl:col-span-5"
          title="Universe scan · NIFTY 50"
          icon="Boxes"
          sub="Bar height = today's % change · a light sweeps the grid on every scan"
          right={<Pill tone="indigo" icon="Orbit">3D</Pill>}
          body="flex flex-1 flex-col px-3 pb-3"
        >
          <UniverseScene height={340} fill />
        </Card>
        <PreTradeCheck className="xl:col-span-4" />
        <div className="space-y-4 xl:col-span-3">
          <OrdersList />
          <AgentNow />
        </div>
      </div>
    </div>
  );
}
