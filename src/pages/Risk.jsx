import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { useSim, useDerived } from '../store/useSim.js';
import { Bar, Card, Ic, Pill, Tilt } from '../components/ui/primitives.jsx';
import { KillSwitch, LossGauge } from '../components/trading/Guardrails.jsx';
import { AuditLog, RulesCode } from '../components/trading/Audit.jsx';
import { PreTradeCheck } from '../components/trading/Agent.jsx';
import { ENDPOINTS } from '../data/constants.js';
import { DRILLS } from '../data/history.js';
import { START } from '../sim/index.js';
import { cx } from '../lib/cx.js';
import { OPEN, CLOSE, T, hm, hms, inr, pct } from '../lib/format.js';

const AXIS = { fontSize: 10, fill: '#71717a', fontFamily: 'Geist Mono, ui-monospace, monospace' };
const HOURS = [OPEN, T(10), T(11), T(12), T(13), T(14), T(15), CLOSE];

function Rule({ icon, title, limit, value, used, note, tone }) {
  return (
    <Tilt className="rounded-xl border border-line bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-acid/10 text-acid ring-1 ring-acid/20">
          <Ic n={icon} size={15} />
        </span>
        <Pill tone={tone || 'acid'} dot>
          {limit}
        </Pill>
      </div>
      <p className="mt-3 text-sm font-semibold text-zinc-100">{title}</p>
      <p className="mt-0.5 font-mono text-lg text-zinc-200 tnum">{value}</p>
      {used != null && <Bar className="mt-2" value={Math.min(1, used)} color={used > 1.0001 ? '#F43F5E' : '#C6FF00'} />}
      <p className="mt-2 text-[11px] leading-snug text-zinc-500">{note}</p>
    </Tilt>
  );
}

function PnlVsLimit() {
  const curve = useSim((st) => st.sim.curve);
  const t = useSim((st) => st.sim.t);
  const d = useDerived();
  const data = useMemo(() => {
    const pts = curve.map((p) => ({ t: p.t, pnl: p.eq - START }));
    if (t >= OPEN) pts.push({ t: Math.min(Math.round(t), CLOSE), pnl: d.dayPnl });
    return pts;
  }, [curve, t, d.dayPnl]);
  const lo = Math.min(-21000, ...data.map((p) => p.pnl));
  const hi = Math.max(6000, ...data.map((p) => p.pnl));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 14, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={d.dayPnl >= 0 ? '#C6FF00' : '#F43F5E'} stopOpacity={0.3} />
            <stop offset="100%" stopColor={d.dayPnl >= 0 ? '#C6FF00' : '#F43F5E'} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1d1d22" vertical={false} />
        <XAxis dataKey="t" type="number" domain={[OPEN, CLOSE]} ticks={HOURS} tickFormatter={hm} tick={AXIS} tickLine={false} axisLine={{ stroke: '#26262c' }} allowDataOverflow />
        <YAxis domain={[lo - 1000, hi + 1000]} ticks={[-20000, -15000, -10000, -5000, 0, 5000, 10000].filter((v) => v >= lo - 1000 && v <= hi + 1000)} tickFormatter={(v) => `${v < 0 ? '−' : ''}₹${Math.abs(v / 1000).toFixed(0)}k`} tick={AXIS} tickLine={false} axisLine={false} width={52} />
        <Tooltip
          cursor={{ stroke: '#3f3f46' }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="rounded-lg border border-line2 bg-panel/95 px-2.5 py-1.5 font-mono text-[11px] text-zinc-200 shadow-xl">
                {hm(payload[0].payload.t)} · day {inr(payload[0].payload.pnl, 0, true)}
              </div>
            ) : null
          }
        />
        <ReferenceLine y={0} stroke="#52525b" />
        <ReferenceLine y={-10000} stroke="#F59E0B" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: '50%', fill: '#F59E0B', fontSize: 10, position: 'insideRight' }} />
        <ReferenceLine y={-15000} stroke="#F59E0B" strokeDasharray="4 4" strokeOpacity={0.9} label={{ value: '75% · entries blocked', fill: '#FBBF24', fontSize: 10, position: 'insideRight' }} />
        <ReferenceLine y={-20000} stroke="#F43F5E" strokeWidth={1.5} label={{ value: '−2% · flatten + lock', fill: '#FB7185', fontSize: 10, position: 'insideRight' }} />
        <Area type="monotone" dataKey="pnl" stroke={d.dayPnl >= 0 ? '#C6FF00' : '#F43F5E'} strokeWidth={2} fill="url(#pnlFill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Risk() {
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  const largest = sim.positions.reduce((m, p) => Math.max(m, (p.entry * p.qty) / START), 0);
  const lastRisk = sim.proposal ? sim.proposal.riskPct : 0;
  const halts = sim.audit.filter((a) => a.type === 'HALT');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4" title="Daily loss limit" icon="Gauge" tone={sim.halted ? 'rose' : undefined} right={<Pill tone={d.used >= 0.75 ? 'rose' : d.used >= 0.5 ? 'amber' : 'green'} dot pulse>{d.used >= 0.75 ? 'critical' : d.used >= 0.5 ? 'warning' : 'safe'}</Pill>}>
          <LossGauge d={d} size={320} />
          <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
            {[
              ['50%', 'warn', 'text-amber-300'],
              ['75%', 'block new entries', 'text-amber-300'],
              ['100%', 'flatten + lock', 'text-rose-300'],
            ].map(([k, v, c]) => (
              <li key={k} className="rounded-lg border border-line bg-panel px-2 py-2">
                <p className={cx('font-mono font-semibold', c)}>{k}</p>
                <p className="text-zinc-500">{v}</p>
              </li>
            ))}
          </ol>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-8">
          <Rule icon="Target" title="Risk per trade" limit="≤ 1%" value={lastRisk ? pct(lastRisk, 2, false) : '—'} used={lastRisk / 0.01} note="Size = 1% of start-of-day equity ÷ stop distance. Last order shown." />
          <Rule
            icon="Layers"
            title="Largest position at entry"
            limit="≤ 25%"
            value={pct(largest, 1, false)}
            used={largest / 0.25}
            note="Orders above 25% of equity are vetoed and resized. The cap applies when the order is placed."
          />
          <Rule
            icon="Boxes"
            title="Open slots"
            limit="≤ 4"
            value={`${sim.positions.length} of 4`}
            used={sim.positions.length / 4}
            note={`Open risk ${inr(d.openRisk)} (${pct(d.openRisk / 1e6, 2, false)}) across positions.`}
          />
          <Card title="Paper-only allowlist" icon="Lock" right={<Pill tone="green" icon="BadgeCheck">self-test passed</Pill>}>
            <ul className="space-y-1.5">
              {ENDPOINTS.map((e) => (
                <li key={e.host} className="flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs">
                  <span className={cx('grid h-5 w-5 place-items-center rounded-full', e.ok ? 'bg-acid text-ink' : 'bg-rose-500/20 text-rose-300')}>
                    <Ic n={e.ok ? 'Check' : 'Ban'} size={11} sw={2.6} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-zinc-200">{e.host}</span>
                    <span className="block text-[10px] text-zinc-500">{e.role}</span>
                  </span>
                  <Pill tone={e.ok ? 'acid' : 'rose'}>{e.ok ? 'allowed' : 'blocked'}</Pill>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5" title="Human kill switch" icon="Power" tone={sim.halted ? 'rose' : undefined} sub="cancel · flatten · lock · re-arm needs 2 steps">
          <div className="rounded-xl border border-line bg-panel p-4">
            <KillSwitch where="risk" />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Halt history</p>
            <ul className="space-y-1.5">
              {halts.map((a) => (
                <li key={a.id} className="flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-2 text-xs">
                  <Ic n="OctagonX" size={14} className="text-rose-400" />
                  <span className="font-mono text-zinc-500 tnum">
                    {a.day} {hms(a.t)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-zinc-300" title={a.detail}>
                    {a.detail}
                  </span>
                </li>
              ))}
              {DRILLS.slice(1).map((r) => (
                <li key={r.day} className="flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-2 text-xs opacity-70">
                  <Ic n="RefreshCw" size={14} className="text-zinc-500" />
                  <span className="font-mono text-zinc-500 tnum">
                    {r.day} {hms(r.t)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-zinc-400">
                    {r.what} · {r.ms} s · {r.by}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <Card className="xl:col-span-7" title="Day P&L against the limit" icon="ChartArea" sub="Warn at 50%, block entries at 75%, flatten and lock at −2%" body="px-2 pb-3">
          <PnlVsLimit />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <AuditLog className="xl:col-span-8" />
        <div className="space-y-4 xl:col-span-4">
          <PreTradeCheck />
          <RulesCode />
        </div>
      </div>
    </div>
  );
}
