import { useSim } from '../../store/useSim.js';
import { STRATEGIES } from '../../data/constants.js';
import { ToolChip } from './Agent.jsx';
import { Ic, Pill, TypeOut } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { fmtP, hm, inr, pct, rStr } from '../../lib/format.js';

function Fact({ k, v, tone }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</dt>
      <dd className={cx('truncate font-mono text-xs tnum', tone || 'text-zinc-200')}>{v}</dd>
    </div>
  );
}

function StatusBadge({ e, px }) {
  if (e.status === 'satout') return <Pill tone="amber" icon="Hand">Sat out</Pill>;
  if (e.status === 'open') {
    const pnl = px != null ? (px - e.entry) * e.qty : 0;
    return (
      <span className="inline-flex items-center gap-2">
        <Pill tone="acid" dot pulse>
          Open
        </Pill>
        <span className={cx('font-mono text-xs tnum', pnl >= 0 ? 'text-acid' : 'text-rose-400')}>{inr(pnl, 2, true)}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Pill tone={e.pnl >= 0 ? 'green' : 'rose'}>{e.exitReason === 'kill' ? 'Closed · kill switch' : e.exitReason === 'stop' ? 'Closed · stop' : 'Closed'}</Pill>
      <span className={cx('font-mono text-xs tnum', e.pnl >= 0 ? 'text-acid' : 'text-rose-400')}>
        {inr(e.pnl, 2, true)} · {rStr(e.R)}
      </span>
    </span>
  );
}

export function JournalCard({ e }) {
  const px = useSim((st) => (e.status === 'open' && st.sim.universe[e.sym] ? st.sim.universe[e.sym].p : null));
  const satout = e.status === 'satout';
  return (
    <article className="group relative animate-fadein rounded-xl border border-line bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-acid/30 hover:shadow-glowsm">
      <header className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-zinc-400 ring-1 ring-white/[0.06]">{e.id}</span>
        {!satout && <h3 className="text-base font-semibold tracking-tight text-zinc-50">{e.sym}</h3>}
        {!satout && <Pill tone="acid">{e.side}</Pill>}
        <Pill tone={STRATEGIES[e.strategy]?.tone || 'zinc'}>{e.strategy}</Pill>
        <Pill tone="zinc">{e.regime}</Pill>
        {e.vetoed && (
          <Pill tone="rose" icon="Ban">
            resized after veto
          </Pill>
        )}
        <span className="text-[11px] text-zinc-500">
          {e.day} · {hm(e.t)} IST
        </span>
        <span className="ml-auto">
          <StatusBadge e={e} px={px} />
        </span>
      </header>

      <div className={cx('mt-3 grid gap-4', !satout && 'lg:grid-cols-[minmax(0,1fr)_250px]')}>
        <div className="min-w-0">
          <p className="relative pl-6 text-[15px] leading-relaxed text-zinc-200">
            <Ic n="Quote" size={15} className="absolute left-0 top-1 text-acid/70" />
            <TypeOut text={e.prose} born={e.born} cps={95} />
          </p>
          {e.notes && e.notes.length > 0 && (
            <ol className="mt-3 space-y-2 border-l border-line pl-4">
              {e.notes.map((n) => (
                <li key={`${n.t}${n.text.slice(0, 12)}`} className="relative text-[13px] leading-snug text-zinc-400">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-zinc-500 ring-4 ring-card" />
                  <span className="mr-2 font-mono text-[11px] text-zinc-500 tnum">{hm(n.t)}</span>
                  {n.born ? <TypeOut text={n.text} born={n.born} cps={95} /> : n.text}
                </li>
              ))}
            </ol>
          )}
          {e.lesson && (
            <p className="mt-3 flex gap-2 rounded-lg border border-indigo-400/20 bg-indigo-500/[0.06] px-3 py-2 text-xs text-indigo-200">
              <Ic n="Sparkles" size={13} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold">Lesson:</span> {e.lesson}
              </span>
            </p>
          )}
        </div>

        {!satout && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 self-start rounded-lg border border-line bg-panel p-3">
            <Fact k="Size" v={`${e.qty} sh`} />
            <Fact k="Entry" v={`₹${fmtP(e.entry)}`} />
            <Fact k="Stop" v={`₹${fmtP(e.stop)}`} tone="text-rose-300" />
            <Fact k="Target" v={e.target ? `₹${fmtP(e.target)}${e.targetWas ? ' (was ₹' + fmtP(e.targetWas) + ')' : ''}` : 'RSI(2) > 70'} tone="text-acid" />
            <Fact k="Risk" v={`${inr(e.riskRs)} · ${pct(e.riskPct, 2, false)}`} />
            <Fact k="Regime" v={e.regime} />
            <Fact k="News" v={e.news} tone={String(e.news).startsWith('+') ? 'text-acid' : 'text-rose-300'} />
            <Fact k="Backtest" v={e.backtest} />
            {e.status === 'closed' && <Fact k="Exit" v={`₹${fmtP(e.exit)}`} />}
            {e.status === 'closed' && <Fact k="Result" v={`${inr(e.pnl, 0, true)} · ${rStr(e.R)}`} tone={e.pnl >= 0 ? 'text-acid' : 'text-rose-300'} />}
          </dl>
        )}
      </div>

      <footer className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        {e.verified && (
          <Pill tone="green" icon="BadgeCheck">
            Numbers match the ledger
          </Pill>
        )}
        <span className="text-[11px] text-zinc-600">tools</span>
        <div className="flex flex-wrap gap-1 opacity-70 transition group-hover:opacity-100">
          {[...new Set(e.tools)].map((t) => (
            <ToolChip key={t} name={t} />
          ))}
        </div>
      </footer>
    </article>
  );
}
