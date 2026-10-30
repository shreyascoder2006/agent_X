import { useMemo, useState } from 'react';
import { ResponsiveContainer, ComposedChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { useSim, useDerived } from '../store/useSim.js';
import { Card, Ic, Pill, Segmented, Tilt } from '../components/ui/primitives.jsx';
import { RANGES, STRATS, TRADE_STATS, getSeries, stats, drawdowns, monthlyGrid, MONTH_LABELS } from '../data/backtest.js';
import { SERIES } from '../data/backtestData.js';
import { cx } from '../lib/cx.js';
import { inr, pct, plural } from '../lib/format.js';

const AXIS = { fontSize: 10, fill: '#71717a', fontFamily: 'Geist Mono, ui-monospace, monospace' };

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line2 bg-panel/95 px-3 py-2 text-xs shadow-2xl backdrop-blur">
      <p className="mb-1 font-mono text-zinc-400">{p.m}</p>
      <p className="flex justify-between gap-6 text-zinc-300">
        <span>Niyam</span>
        <span className="font-mono text-acid tnum">₹{p.niyam.toFixed(2)} L</span>
      </p>
      <p className="flex justify-between gap-6 text-zinc-300">
        <span>Buy-and-hold</span>
        <span className="font-mono text-zinc-200 tnum">₹{p.bh.toFixed(2)} L</span>
      </p>
    </div>
  );
}

function StatTile({ label, niyam, bh, better, hint }) {
  return (
    <Tilt className="rounded-xl border border-line bg-card p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
        {better != null && (
          <Pill tone={better ? 'acid' : 'rose'} icon={better ? 'ArrowUpRight' : 'ArrowDownRight'}>
            {better ? 'better' : 'worse'}
          </Pill>
        )}
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold text-zinc-50 tnum">{niyam}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">
        {bh != null ? (
          <>
            buy-and-hold <span className="font-mono text-zinc-300 tnum">{bh}</span>
          </>
        ) : (
          hint
        )}
      </p>
    </Tilt>
  );
}

function ReplayResult({ summary }) {
  const rows = [
    { k: 'Niyam (replay day)', v: summary.dayPct, c: '#C6FF00' },
    { k: 'Buy-and-hold NIFTY 50', v: summary.bhPct, c: '#A1A1AA' },
    { k: 'Daily loss limit', v: -0.02, c: '#F43F5E' },
  ];
  const max = Math.max(0.03, ...rows.map((r) => Math.abs(r.v)));
  return (
    <Card glow title="Replay result · crash day" icon="Target" sub="Fri 30 Oct 2026 · same ₹10 L start" right={<Pill tone="acid" icon="BadgeCheck">loss held inside the limit</Pill>}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          <p className="font-mono text-4xl font-semibold text-zinc-50 tnum">{pct(summary.dayPct)}</p>
          <p className="mt-1 text-sm text-zinc-400">
            Niyam lost <span className="font-mono text-zinc-200 tnum">{inr(-summary.dayPnl)}</span>; buy-and-hold lost{' '}
            <span className="font-mono text-zinc-200 tnum">{inr(-summary.bhPnl)}</span>. The guardrails kept{' '}
            <span className="font-mono text-acid tnum">{inr(summary.saved)}</span> that an index holder gave back.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="zinc">{plural(summary.trades, 'trade')}</Pill>
            <Pill tone="rose">{plural(summary.stops, 'stop')} hit</Pill>
            <Pill tone="amber">{plural(summary.vetoes, 'veto')}</Pill>
            <Pill tone="rose" icon="Power">
              {summary.haltedBy === 'demo' ? 'kill switch (auto-press)' : summary.haltedBy ? 'kill switch pressed' : 'no halt'}
            </Pill>
            <Pill tone="zinc">peak limit use {Math.round(summary.maxUsed * 100)}%</Pill>
          </div>
        </div>
        <ul className="space-y-3 self-center">
          {rows.map((r) => (
            <li key={r.k}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-zinc-300">{r.k}</span>
                <span className="font-mono tnum" style={{ color: r.c }}>
                  {pct(r.v)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${(Math.abs(r.v) / max) * 100}%`, background: r.c }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function TodayStrip() {
  const d = useDerived();
  const diff = d.dayPct - d.bhPct;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm">
      <Ic n="Activity" size={15} className="text-acid" />
      <span className="text-zinc-400">Today so far</span>
      <span className="font-mono text-zinc-100 tnum">Niyam {pct(d.dayPct)}</span>
      <span className="font-mono text-zinc-400 tnum">NIFTY 50 {pct(d.bhPct)}</span>
      <Pill tone={diff >= 0 ? 'acid' : 'rose'}>
        {diff >= 0 ? '+' : '−'}
        {Math.abs(diff * 100).toFixed(2)} pp vs buy-and-hold
      </Pill>
      <span className="ml-auto text-xs text-zinc-500">Run the demo to replay a full crash day.</span>
    </div>
  );
}

export default function Backtest() {
  const summary = useSim((st) => st.sim.demo?.summary);
  const [strategy, setStrategy] = useState('portfolio');
  const [range, setRange] = useState('ALL');
  const rows = useMemo(() => getSeries(strategy, range), [strategy, range]);
  const dd = useMemo(() => drawdowns(rows), [rows]);
  const sN = useMemo(() => stats(rows.map((r) => r.niyam)), [rows]);
  const sB = useMemo(() => stats(rows.map((r) => r.bh)), [rows]);
  const ts = TRADE_STATS[strategy];
  const years = (rows.length - 1) / 12;
  const trades = Math.round(ts.trades * (years / 4));
  const grid = useMemo(() => monthlyGrid(strategy), [strategy]);
  const rangeMeta = RANGES.find((r) => r.id === range);
  const label = STRATS.find((s) => s.id === strategy).label;

  return (
    <div className="space-y-4">
      {summary ? <ReplayResult summary={summary} /> : <TodayStrip />}

      <div className="flex flex-wrap items-center gap-2">
        <Segmented options={STRATS} value={strategy} onChange={setStrategy} label="Strategy" />
        <Segmented options={RANGES} value={range} onChange={setRange} label="Time range" />
        <span className="ml-auto text-xs text-zinc-500">
          NIFTY 50 universe · {rangeMeta.span} · monthly marks · ₹10 L start · illustrative
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card
          className="xl:col-span-8"
          title={`${label} vs buy-and-hold`}
          icon="ChartLine"
          sub="Equity in ₹ lakh, with drawdown from the running peak below"
          right={
            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm bg-acid" /> Niyam ₹{sN.end.toFixed(1)} L
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0 w-3 border-t border-dashed border-zinc-400" /> Buy-and-hold ₹{sB.end.toFixed(1)} L
              </span>
            </div>
          }
          body="px-2 pb-3"
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart key={`${strategy}${range}`} data={rows} margin={{ top: 12, right: 14, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="btFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C6FF00" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="#C6FF00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1d1d22" vertical={false} />
              <XAxis dataKey="m" tick={AXIS} tickLine={false} axisLine={{ stroke: '#26262c' }} interval={Math.max(0, Math.round(rows.length / 8) - 1)} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v.toFixed(0)}L`} domain={['dataMin - 0.4', 'dataMax + 0.4']} width={48} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: '#3f3f46', strokeDasharray: '3 3' }} />
              <ReferenceLine y={10} stroke="#52525b" strokeDasharray="2 4" />
              <Area type="monotone" dataKey="niyam" stroke="#C6FF00" strokeWidth={2.2} fill="url(#btFill)" animationDuration={900} />
              <Line type="monotone" dataKey="bh" stroke="#a1a1aa" strokeWidth={1.4} strokeDasharray="5 4" dot={false} animationDuration={900} />
            </ComposedChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart key={`dd${strategy}${range}`} data={dd} margin={{ top: 4, right: 14, bottom: 0, left: 0 }}>
              <XAxis dataKey="m" hide />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} width={48} domain={['dataMin - 1', 0]} />
              <Tooltip
                cursor={{ stroke: '#3f3f46' }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border border-line2 bg-panel/95 px-2.5 py-1.5 font-mono text-[11px] text-zinc-300 shadow-xl">
                      {payload[0].payload.m} · Niyam {payload[0].payload.niyam.toFixed(1)}% · B&amp;H {payload[0].payload.bh.toFixed(1)}%
                    </div>
                  ) : null
                }
              />
              <Area type="monotone" dataKey="bh" stroke="#F43F5E" strokeOpacity={0.7} fill="#F43F5E" fillOpacity={0.14} strokeWidth={1} animationDuration={900} />
              <Area type="monotone" dataKey="niyam" stroke="#C6FF00" fill="#C6FF00" fillOpacity={0.16} strokeWidth={1.5} animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="px-3 text-[11px] text-zinc-500">
            Drawdown · Niyam <span className="font-mono text-acid">{pct(sN.mdd, 1)}</span> worst vs buy-and-hold{' '}
            <span className="font-mono text-rose-300">{pct(sB.mdd, 1)}</span>
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3 xl:col-span-4">
          <StatTile label="End value" niyam={`₹${sN.end.toFixed(1)} L`} bh={`₹${sB.end.toFixed(1)} L`} better={sN.end > sB.end} />
          <StatTile label="CAGR" niyam={pct(sN.cagr, 1, false)} bh={pct(sB.cagr, 1, false)} better={sN.cagr > sB.cagr} />
          <StatTile label="Sharpe" niyam={sN.sharpe.toFixed(2)} bh={sB.sharpe.toFixed(2)} better={sN.sharpe > sB.sharpe} />
          <StatTile label="Max drawdown" niyam={pct(sN.mdd, 1)} bh={pct(sB.mdd, 1)} better={sN.mdd > sB.mdd} />
          <StatTile label="Win rate" niyam={pct(ts.winRate, 1, false)} hint={`${trades} trades in range`} />
          <StatTile label="Profit factor" niyam={ts.profitFactor.toFixed(2)} hint={`avg ${ts.avgR >= 0 ? '+' : ''}${ts.avgR.toFixed(2)}R per trade`} />
          <p className="col-span-2 rounded-lg border border-line bg-panel px-3 py-2 text-[11px] leading-snug text-zinc-500">
            Sharpe uses a 6.5% risk-free rate. Win rate and profit factor come from the trade log; other figures from monthly equity. Illustrative backtest, not a forecast.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7" title={`Monthly returns · ${label}`} icon="ChartColumn" sub="Lime months gained, rose months lost · hover for the exact figure">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[520px] border-separate border-spacing-1 text-center">
              <thead>
                <tr>
                  <th className="w-12" />
                  {MONTH_LABELS.map((m, i) => (
                    <th key={i} className="text-[10px] font-medium text-zinc-500">
                      {m}
                    </th>
                  ))}
                  <th className="text-[10px] font-medium text-zinc-500">Year</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grid).map(([year, months]) => {
                  const yr = months.reduce((a, r) => a * (1 + r), 1) - 1;
                  return (
                    <tr key={year}>
                      <td className="text-left font-mono text-[11px] text-zinc-400">{year}</td>
                      {months.map((r, i) => {
                        const a = Math.min(1, Math.abs(r) / 0.05) * 0.75 + 0.08;
                        return (
                          <td
                            key={i}
                            title={`${MONTH_LABELS[i]} ${year}: ${pct(r, 1)}`}
                            className="h-9 rounded-md font-mono text-[10px] text-zinc-100 transition hover:scale-110 hover:ring-1 hover:ring-white/40"
                            style={{ background: r >= 0 ? `rgba(198,255,0,${a})` : `rgba(244,63,94,${a})`, color: r >= 0 && a > 0.5 ? '#09090B' : undefined }}
                          >
                            {(r * 100).toFixed(1)}
                          </td>
                        );
                      })}
                      <td className={cx('font-mono text-[11px] font-semibold', yr >= 0 ? 'text-acid' : 'text-rose-400')}>{pct(yr, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="xl:col-span-5" title="Strategy breakdown · all years" icon="Layers" sub="Each sleeve vs the combined portfolio" body="px-2 pb-3">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[420px] text-xs">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="px-2 py-2 text-left font-medium">Strategy</th>
                  <th className="px-2 py-2 text-right font-medium">CAGR</th>
                  <th className="px-2 py-2 text-right font-medium">Sharpe</th>
                  <th className="px-2 py-2 text-right font-medium">Max DD</th>
                  <th className="px-2 py-2 text-right font-medium">Trades</th>
                  <th className="px-2 py-2 text-right font-medium">Win</th>
                </tr>
              </thead>
              <tbody>
                {[...STRATS, { id: 'bh', label: 'Buy-and-hold' }].map((s) => {
                  const st = stats(SERIES[s.id]);
                  const t = TRADE_STATS[s.id];
                  const on = s.id === strategy;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => s.id !== 'bh' && setStrategy(s.id)}
                      className={cx('border-b border-line/50 transition-colors', s.id !== 'bh' && 'cursor-pointer hover:bg-white/[0.03]', on && 'bg-acid/[0.06]')}
                    >
                      <td className={cx('px-2 py-2.5 font-medium', on ? 'text-acid' : s.id === 'bh' ? 'text-zinc-500' : 'text-zinc-200')}>{s.label}</td>
                      <td className="px-2 text-right font-mono tnum text-zinc-300">{pct(st.cagr, 1, false)}</td>
                      <td className="px-2 text-right font-mono tnum text-zinc-300">{st.sharpe.toFixed(2)}</td>
                      <td className="px-2 text-right font-mono tnum text-rose-300">{pct(st.mdd, 1)}</td>
                      <td className="px-2 text-right font-mono tnum text-zinc-400">{t ? t.trades : '—'}</td>
                      <td className="px-2 text-right font-mono tnum text-zinc-400">{t ? pct(t.winRate, 0, false) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 px-2 text-[11px] leading-snug text-zinc-500">
            The portfolio's drawdown is shallower than any single sleeve: trend, mean-reversion and breakout losses rarely land in the same month.
          </p>
        </Card>
      </div>
    </div>
  );
}
