import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSim, useDerived } from '../../store/useSim.js';
import { NAV } from '../../data/constants.js';
import { Dot, Ic, Logo, Ring } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { hm } from '../../lib/format.js';

function useBadges(sim) {
  const vetoes = sim.audit.filter((a) => a.day === 'Today' && a.type === 'VETO').length;
  return {
    dashboard: sim.positions.length ? { text: String(sim.positions.length), tone: 'neutral', title: 'open positions' } : null,
    activity: { live: true },
    journal: { text: String(sim.journal.filter((j) => j.day === 'Today').length), tone: 'neutral', title: 'entries today' },
    backtest: sim.demo?.summary ? { text: 'result', tone: 'neutral' } : null,
    risk: sim.halted ? { text: 'halt', tone: 'rose' } : vetoes ? { text: `${vetoes} veto`, tone: 'amber' } : null,
    architecture: { text: '3D', tone: 'neutral' },
  };
}

const BADGE = {
  neutral: 'text-fg-3',
  rose: 'bg-risk/15 text-risk-text px-1.5',
  amber: 'bg-warn/10 text-warn-text px-1.5',
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
    <aside className="relative z-20 hidden w-[232px] shrink-0 flex-col border-r border-hair bg-panel/60 md:flex">
      <NavLink to="/home" title="Back to the Niyam home page" className="flex h-14 items-center gap-2.5 border-b border-hair px-4 transition-colors hover:bg-white/[0.02]">
        <Logo size={26} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold text-fg">Circuit Breakers</p>
          <p className="truncate text-cap text-fg-3">Niyam · paper workspace</p>
        </div>
        <Ic n="ChevronsUpDown" size={14} className="text-fg-mute" />
      </NavLink>

      <nav className="scroll-thin flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3" aria-label="Main">
        {NAV.map((n, i) => {
          const b = badges[n.id];
          const pulse = cueView === n.id && location.pathname !== `/${n.id}`;
          return (
            <NavLink
              key={n.id}
              to={`/${n.id}`}
              onClick={() => onNav(n.id)}
              className={({ isActive }) =>
                cx(
                  'group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-body transition-colors duration-150',
                  isActive ? 'text-fg' : 'text-fg-2 hover:bg-white/[0.03] hover:text-fg',
                  pulse && 'animate-cue',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg border border-hair bg-white/[0.045]"
                      transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                    >
                      <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-x-[3px] -translate-y-1/2 rounded-full bg-lime" />
                    </motion.span>
                  )}
                  <Ic n={n.icon} size={16} className={cx('relative transition-colors', isActive ? 'text-fg' : 'text-fg-mute group-hover:text-fg-2')} />
                  <span className="relative min-w-0 flex-1 truncate font-medium">{n.label}</span>
                  {b?.live ? (
                    <Dot tone={sim.halted ? 'rose' : 'lime'} pulse={!sim.halted} className="relative mr-1" />
                  ) : (
                    b && (
                      <span title={b.title} className={cx('num relative rounded text-cap', BADGE[b.tone])}>
                        {b.text}
                      </span>
                    )
                  )}
                  <span className="sr-only">{`view ${i + 1}`}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-hair p-2.5">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Ring value={d.loopProgress} size={30} stroke={2} color={sim.halted ? '#F43F5E' : '#A3A9B3'}>
            <span className="num text-cap text-fg-2">{d.loop}</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-cap font-medium text-fg">
              <Dot tone={sim.halted ? 'rose' : 'lime'} pulse={!sim.halted} />
              {sim.halted ? 'Agent halted' : sim.mode === 'demo' ? 'Agent · replay' : 'Agent running'}
            </p>
            <p className="num truncate text-cap text-fg-3">
              {sim.halted ? 'awaiting re-arm' : `${sim.node} · next ${hm(d.nextLoop)}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={sim.halted ? rearmStart : kill}
          aria-label={sim.halted ? 'Trading halted. Start the re-arm' : 'Kill switch: cancel orders, flatten positions, lock trading'}
          className={cx(
            'group flex h-10 w-full items-center gap-2.5 rounded-lg border px-3 text-left transition-colors duration-200',
            sim.halted ? 'border-risk/50 bg-risk/15 text-risk-text' : 'border-risk/25 bg-risk/[0.05] text-risk-text hover:border-risk/45 hover:bg-risk/10',
            killCue && 'animate-pulse border-risk',
          )}
        >
          <Ic n={sim.halted ? 'Lock' : 'Power'} size={15} sw={2.2} />
          <span className="flex-1 text-body font-semibold">{sim.halted ? 'Halted · re-arm' : 'Kill switch'}</span>
          <span className="text-cap opacity-70">{sim.halted ? '2 steps' : 'one press'}</span>
        </button>

        <p className="px-2 pt-1 text-cap text-fg-mute">AgentX 2026 · PS-02 · paper only</p>
      </div>
    </aside>
  );
}
