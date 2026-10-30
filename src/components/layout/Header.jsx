import { NavLink, useLocation } from 'react-router-dom';
import { useSim, useDerived } from '../../store/useSim.js';
import { NAV } from '../../data/constants.js';
import { DEMO_END } from '../../sim/index.js';
import { Ic, Logo, Pill } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { hms, mmss } from '../../lib/format.js';

export function Header() {
  const location = useLocation();
  const meta = NAV.find((n) => `/${n.id}` === location.pathname) || NAV[0];
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  const startDemo = useSim((st) => st.startDemo);
  const exitDemo = useSim((st) => st.exitDemo);
  const demo = sim.mode === 'demo';

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/80 backdrop-blur-xl">
      <div className="content-x flex flex-wrap items-center gap-x-4 gap-y-3 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="md:hidden">
            <Logo size={30} />
          </span>
          <div className="min-w-0">
            <div className="hidden items-center gap-1.5 text-[11px] text-zinc-500 sm:flex">
              <span>Niyam</span>
              <Ic n="ChevronRight" size={11} />
              <span className="text-zinc-400">{meta.label}</span>
            </div>
            <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-50 [text-wrap:balance]">{meta.title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 sm:flex">
            <Ic n="Clock" size={13} className="text-zinc-500" />
            <span className="font-mono text-sm text-zinc-100 tnum">{hms(sim.t)}</span>
            <span className="text-[11px] text-zinc-500">IST · Fri 30 Oct</span>
          </div>
          <Pill tone={d.status === 'OPEN' ? 'green' : 'zinc'} dot pulse={d.status === 'OPEN'} className="hidden sm:inline-flex">
            NSE {d.status}
          </Pill>
          <Pill tone={demo ? 'indigo' : 'acid'} dot pulse>
            {demo ? 'REPLAY' : 'LIVE'}
          </Pill>
          {sim.halted && (
            <Pill tone="rose" icon="Lock">
              HALTED
            </Pill>
          )}
          {demo ? (
            <button
              type="button"
              onClick={exitDemo}
              className="inline-flex items-center gap-2 rounded-lg border border-line2 bg-card px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
            >
              <Ic n="X" size={14} /> Exit replay
            </button>
          ) : (
            <button
              type="button"
              onClick={startDemo}
              className="group inline-flex items-center gap-2 rounded-lg bg-acid px-3.5 py-2 text-sm font-semibold text-ink shadow-glow transition hover:brightness-110 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Ic n="Play" size={15} sw={2.4} className="transition group-hover:scale-110" /> Run Demo
              <span className="hidden rounded bg-ink/15 px-1.5 py-0.5 font-mono text-[10px] lg:inline">{mmss(DEMO_END)}</span>
            </button>
          )}
        </div>
      </div>
      <MobileNav />
    </header>
  );
}

function MobileNav() {
  return (
    <nav className="content-x flex items-center justify-between gap-1 border-t border-line py-1.5 md:hidden" aria-label="Main">
      {NAV.map((n) => (
        <NavLink
          key={n.id}
          to={`/${n.id}`}
          aria-label={n.label}
          className={({ isActive }) =>
            cx(
              'grid h-10 flex-1 place-items-center rounded-lg transition',
              isActive ? 'bg-acid/10 text-acid' : 'text-zinc-500 hover:text-zinc-200',
            )
          }
        >
          <Ic n={n.icon} size={18} />
        </NavLink>
      ))}
    </nav>
  );
}
