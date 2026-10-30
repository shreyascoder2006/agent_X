import { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useSim } from '../store/useSim.js';
import { Card, Ic, Pill, Segmented, Tilt } from '../components/ui/primitives.jsx';
import { JournalCard } from '../components/trading/Journal.jsx';
import { cx } from '../lib/cx.js';
import { inr, pct, rStr } from '../lib/format.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'satout', label: 'Sat out' },
];

const AXIS = { fontSize: 10, fill: '#71717a', fontFamily: 'Geist Mono, ui-monospace, monospace' };

function Stat({ label, value, sub, tone, icon }) {
  return (
    <Tilt className="rounded-xl border border-line bg-card p-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        <Ic n={icon} size={13} />
        {label}
      </p>
      <p className={cx('mt-2 font-mono text-xl font-semibold tnum', tone || 'text-zinc-50')}>{value}</p>
      <p className="mt-1 text-[11px] text-zinc-500">{sub}</p>
    </Tilt>
  );
}

export default function Journal() {
  const journal = useSim((st) => st.sim.journal);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const closed = journal.filter((e) => e.status === 'closed');
  const wins = closed.filter((e) => e.pnl > 0).length;
  const avgR = closed.length ? closed.reduce((a, e) => a + e.R, 0) / closed.length : 0;
  const realized = closed.reduce((a, e) => a + e.pnl, 0);
  const today = journal.filter((e) => e.day === 'Today');

  const list = journal.filter(
    (e) => (filter === 'all' || e.status === filter) && (!q || `${e.sym} ${e.strategy} ${e.prose}`.toLowerCase().includes(q.toLowerCase())),
  );

  const rBars = useMemo(
    () =>
      [...closed]
        .reverse()
        .map((e) => ({ id: e.id, sym: e.sym, R: Number(e.R.toFixed(2)) })),
    [closed],
  );

  const byStrategy = useMemo(() => {
    const m = {};
    for (const e of closed) {
      m[e.strategy] ||= { pnl: 0, n: 0 };
      m[e.strategy].pnl += e.pnl;
      m[e.strategy].n += 1;
    }
    return Object.entries(m).map(([k, v]) => ({ k, ...v }));
  }, [closed]);
  const maxAbs = Math.max(1, ...byStrategy.map((s) => Math.abs(s.pnl)));
  const lessons = journal.filter((e) => e.lesson).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Entries today" icon="NotebookPen" value={today.length} sub={`${today.filter((e) => e.status === 'open').length} open · ${today.filter((e) => e.status === 'closed').length} closed`} />
        <Stat label="Journal coverage" icon="BadgeCheck" value="100%" tone="text-acid" sub="Every trade and every sit-out explained" />
        <Stat label="Win rate" icon="Target" value={closed.length ? pct(wins / closed.length, 0, false) : '—'} sub={`${wins} of ${closed.length} closed trades`} />
        <Stat
          label="Average R"
          icon="Scale"
          value={closed.length ? rStr(avgR) : '—'}
          tone={avgR >= 0 ? 'text-acid' : 'text-rose-400'}
          sub={`${inr(realized, 0, true)} realized across closed trades`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-8">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented options={FILTERS} value={filter} onChange={setFilter} label="Filter entries" />
            <label htmlFor="journal-search" className="relative ml-auto">
              <span className="sr-only">Search the journal</span>
              <Ic n="Search" size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="journal-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search symbol or reason"
                className="w-56 rounded-lg border border-line bg-panel py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-acid/50 focus:outline-none"
              />
            </label>
          </div>
          {list.map((e) => (
            <JournalCard key={e.id} e={e} />
          ))}
          {!list.length && <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-zinc-500">No entries match this filter.</div>}
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Card title="R-multiple per closed trade" icon="ChartColumn" sub="1R = the loss the trade was sized to risk" body="px-2 pb-3">
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={rBars} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
                <XAxis dataKey="sym" tick={AXIS} tickLine={false} axisLine={{ stroke: '#26262c' }} interval={0} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[-1.5, 1.5]} ticks={[-1, 0, 1]} />
                <ReferenceLine y={0} stroke="#3f3f46" />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-line2 bg-panel/95 px-2.5 py-1.5 text-xs text-zinc-200 shadow-xl">
                        {payload[0].payload.id} · {payload[0].payload.sym} · <span className="font-mono">{rStr(payload[0].value)}</span>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="R" radius={[3, 3, 3, 3]} isAnimationActive={false}>
                  {rBars.map((b) => (
                    <Cell key={b.id} fill={b.R >= 0 ? '#C6FF00' : '#F43F5E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="P&L by strategy" icon="Layers">
            <ul className="space-y-3">
              {byStrategy.map((s) => (
                <li key={s.k}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-zinc-300">
                      {s.k} <span className="text-zinc-600">· {s.n} trades</span>
                    </span>
                    <span className={cx('font-mono tnum', s.pnl >= 0 ? 'text-acid' : 'text-rose-400')}>{inr(s.pnl, 0, true)}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-white/[0.05]">
                    <span className="absolute left-1/2 top-[-2px] h-3 w-px bg-zinc-600" />
                    <span
                      className="absolute top-0 h-2 rounded-full"
                      style={{
                        left: s.pnl >= 0 ? '50%' : `${50 - (Math.abs(s.pnl) / maxAbs) * 50}%`,
                        width: `${(Math.abs(s.pnl) / maxAbs) * 50}%`,
                        background: s.pnl >= 0 ? '#C6FF00' : '#F43F5E',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Lessons the agent keeps" icon="Sparkles" sub="Fed back to the planner as similar past setups">
            <ul className="space-y-2">
              {lessons.map((e) => (
                <li key={e.id} className="rounded-lg border border-line bg-panel px-3 py-2">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-zinc-500">{e.id}</span>
                    <Pill tone="zinc">{e.sym === '—' ? 'Sit out' : e.sym}</Pill>
                  </div>
                  <p className="text-xs leading-snug text-zinc-300">{e.lesson}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
