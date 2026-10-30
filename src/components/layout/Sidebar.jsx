import { NavLink, useLocation } from 'react-router-dom';
import { useSim, useDerived } from '../../store/useSim.js';
import { NAV } from '../../data/constants.js';
import { Ic, Logo, Ring } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { hm } from '../../lib/format.js';

function useBadges(sim) {
  const vetoes = sim.audit.filter((a) => a.day === 'Today' && a.type === 'VETO').length;
  return {
    dashboard: sim.positions.length ? { text: `${sim.positions.length} open`, tone: 'acid' } : null,
    activity: { text: 'live', tone: sim.halted ? 'rose' : 'acid', dot: true },
    journal: { text: `${sim.journal.filter((j) => j.day === 'Today').length} today`, tone: 'zinc' },
    backtest: sim.demo?.summary ? { text: 'result', tone: 'acid' } : null,
    risk: sim.halted ? { text: 'HALT', tone: 'rose' } : vetoes ? { text: `${vetoes} veto`, tone: 'amber' } : null,
    architecture: { text: '3D', tone: 'indigo' },
  };
}

const BADGE = {
  acid: 'bg-acid/10 text-acid',
  rose: 'bg-rose-500/20 text-rose-300',
  amber: 'bg-amber-500/15 text-amber-300',
  indigo: 'bg-indigo-500/20 text-indigo-300',
  zinc: 'bg-white/[0.05] text-zinc-400',
};

export function Sidebar() {
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  const kill = useSim((st) => st.kill);
  const rearmStart = useSim((st) => st.rearmStart);
  const setAutoFollow = useSim((st) => st.setAutoFollow);
  const location = useLocation();
  const badges = useBadges(sim);
  const D = sim.demo;
  const cueView = D && D.cue && !D.finished ? D.cue.view : null;
  const killCue = !!(D && D.killCue && !sim.halted);

  const onNav = (id) => {
    // Clicking away from where the replay is leading turns auto-follow off; the nav item pulses instead.
    if (D && D.autoFollow && !D.finished && cueView && id !== cueView) setAutoFollow(false);
  };

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col border-r border-line bg-base/95 md:flex">
      <NavLink to="/home" title="Back to the Niyam home page" className="gutter-l flex h-[68px] items-center gap-3 border-b border-line pr-4 transition-colors hover:bg-white/[0.02]">
        <Logo size={34} />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight text-zinc-50">niyam</p>
          <p className="truncate text-[11px] text-zinc-500">paper-trading agent · PS-02</p>
        </div>
        <span className="ml-auto rounded-md bg-green-600/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-300 ring-1 ring-inset ring-green-500/30">
          Paper
        </span>
      </NavLink>

      <nav className="gutter-l scroll-thin flex-1 space-y-1 overflow-y-auto py-4 pr-3" aria-label="Main">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Workspace</p>
        {NAV.map((n) => {
          const b = badges[n.id];
          const pulse = cueView === n.id && location.pathname !== `/${n.id}`;
          return (
            <NavLink
              key={n.id}
              to={`/${n.id}`}
              onClick={() => onNav(n.id)}
              className={({ isActive }) =>
                cx(
                  'group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/60',
                  isActive ? 'bg-acid/[0.07] text-acid shadow-glowsm' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100',
                  pulse && 'animate-cue',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cx(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 transition-all duration-200',
                      isActive ? 'bg-acid text-ink ring-acid' : 'bg-white/[0.03] text-zinc-400 ring-white/[0.06] group-hover:text-zinc-100',
                    )}
                  >
                    <Ic n={n.icon} size={16} sw={isActive ? 2.1 : 1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{n.label}</span>
                    <span className={cx('block truncate text-[11px]', isActive ? 'text-acid/60' : 'text-zinc-600')}>{n.short}</span>
                  </span>
                  {b && (
                    <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold', BADGE[b.tone])}>
                      {b.dot && <span className={cx('h-1.5 w-1.5 rounded-full', b.tone === 'rose' ? 'bg-rose-400' : 'animate-pulse bg-acid')} />}
                      {b.text}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="gutter-l space-y-3 border-t border-line py-4 pr-3">
        <div className="rounded-xl border border-line bg-card p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className={cx('grid h-9 w-9 place-items-center rounded-lg', sim.halted ? 'bg-rose-500/15 text-rose-400' : 'bg-acid/10 text-acid')}>
                <Ic n="Bot" size={18} />
              </span>
              <span className={cx('absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card', sim.halted ? 'bg-rose-500' : 'animate-pulse bg-acid')} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">Niyam agent</p>
              <p className="truncate text-[11px] text-zinc-500">
                {sim.halted ? 'Halted · awaiting re-arm' : `${sim.mode === 'demo' ? 'Replay' : 'Running'} · node ${sim.node}`}
              </p>
            </div>
            <Ring value={d.loopProgress} size={38} stroke={3} color={sim.halted ? '#F43F5E' : '#C6FF00'}>
              <span className="font-mono text-[10px] tnum text-zinc-300">{d.loop}</span>
            </Ring>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Loop {d.loop} of 25</span>
            <span className="font-mono tnum">next {hm(d.nextLoop)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={sim.halted ? rearmStart : kill}
          className={cx(
            'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300',
            sim.halted ? 'bg-rose-500 text-white shadow-glowrose' : 'bg-rose-500/[0.08] text-rose-300 ring-1 ring-rose-500/40 hover:bg-rose-500/15',
            killCue && 'animate-pulse ring-2 ring-rose-400',
          )}
        >
          <span className="flex items-center gap-2.5">
            <Ic n={sim.halted ? 'Lock' : 'Power'} size={16} sw={2.2} />
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wider">{sim.halted ? 'Halted' : 'Kill switch'}</span>
              <span className="block text-[11px] opacity-75">{sim.halted ? 'Re-arm · 2 steps' : 'cancel · flatten · lock'}</span>
            </span>
          </span>
          <Ic n="ChevronRight" size={14} className="opacity-60 transition group-hover:translate-x-0.5" />
        </button>

        <p className="px-1 text-[10px] leading-relaxed text-zinc-600">
          Team Circuit Breakers · AgentX 2026
          <br />
          Paper trading only · illustrative data
        </p>
      </div>
    </aside>
  );
}
