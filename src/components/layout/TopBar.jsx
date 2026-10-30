import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSim, useDerived } from '../../store/useSim.js';
import { useUI, startDemoWithIntro } from '../../store/useUI.js';
import { NAV } from '../../data/constants.js';
import { DEMO_END } from '../../sim/index.js';
import { Chip, Dot, Ic, Kbd, Logo, btn } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { hm, hms, mmss } from '../../lib/format.js';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
export const MOD = isMac ? '⌘' : 'Ctrl';

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const pop = {
  initial: { opacity: 0, y: -4, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 520, damping: 34 } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } },
};

const TONE_ICON = { acid: ['CircleCheck', 'text-lime'], rose: ['OctagonX', 'text-risk-text'], amber: ['TriangleAlert', 'text-warn-text'] };

function Notifications() {
  const { open, setOpen, ref } = usePopover();
  const items = useUI((s) => s.notifications);
  const unread = useUI((s) => s.unread);
  const markRead = useUI((s) => s.markRead);
  const clear = useUI((s) => s.clearNotifications);
  const hasRisk = items.slice(0, unread).some((n) => n.tone === 'rose');
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        onClick={() => {
          setOpen(!open);
          if (!open) markRead();
        }}
        className={cx(btn.base, btn.ghost, 'relative h-8 w-8 px-0')}
      >
        <Ic n="Bell" size={15} />
        {unread > 0 && (
          <span className={cx('num absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[10px] font-semibold', hasRisk ? 'bg-risk text-white' : 'bg-fg text-bg')}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div {...pop} className="absolute right-0 top-10 z-50 w-[360px] overflow-hidden rounded-xl border border-line bg-overlay/95 shadow-pop backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-hair px-4 py-3">
              <p className="text-h2 text-fg">Notifications</p>
              {items.length > 0 && (
                <button type="button" onClick={clear} className="text-cap text-fg-3 hover:text-fg">
                  Clear all
                </button>
              )}
            </div>
            <ul className="scroll-thin max-h-[380px] overflow-y-auto py-1">
              {items.map((n) => {
                const [icon, c] = TONE_ICON[n.tone] || TONE_ICON.acid;
                return (
                  <li key={n.id} className="flex gap-3 px-4 py-2.5 hover:bg-white/[0.03]">
                    <Ic n={icon} size={15} className={cx('mt-0.5 shrink-0', c)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-fg">{n.title}</p>
                      <p className="truncate text-cap text-fg-3">{n.body}</p>
                    </div>
                    <span className="num shrink-0 text-cap text-fg-3">{hm(n.t)}</span>
                  </li>
                );
              })}
              {!items.length && (
                <li className="px-4 py-8 text-center">
                  <p className="text-body text-fg-2">You are all caught up</p>
                  <p className="text-cap text-fg-3">Fills, vetoes and halts show up here.</p>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountMenu() {
  const { open, setOpen, ref } = usePopover();
  const setPalette = useUI((s) => s.setPalette);
  const halted = useSim((st) => st.sim.halted);
  const rows = [
    ['Account', 'NX-PAPER-01'],
    ['Type', 'Paper · NSE · EQ · CNC'],
    ['Starting capital', '₹10,00,000'],
    ['Broker', 'NiyamEx mock exchange'],
    ['Live endpoints', 'blocked by allowlist'],
  ];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        className="flex h-8 items-center gap-2 rounded-lg border border-hair bg-white/[0.02] pl-1 pr-2 transition hover:border-line"
      >
        <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-b from-[#2A3038] to-[#1A1E24] text-[10px] font-semibold text-fg ring-1 ring-white/10">DK</span>
        <span className="hidden text-left leading-tight 2xl:block">
          <span className="num block text-cap font-medium text-fg">NX-PAPER-01</span>
        </span>
        <Chip tone="green" className="hidden h-[18px] xl:inline-flex">
          Paper
        </Chip>
        <Ic n="ChevronDown" size={13} className="text-fg-mute" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div {...pop} className="absolute right-0 top-10 z-50 w-[300px] overflow-hidden rounded-xl border border-line bg-overlay/95 shadow-pop backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-hair px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-b from-[#2A3038] to-[#1A1E24] text-cap font-semibold text-fg ring-1 ring-white/10">DK</span>
              <div className="min-w-0">
                <p className="text-body font-medium text-fg">D. Krishnan</p>
                <p className="text-cap text-fg-3">Risk operator · Circuit Breakers</p>
              </div>
            </div>
            <dl className="space-y-1.5 px-4 py-3">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-2 text-cap">
                  <dt className="text-fg-3">{k}</dt>
                  <span className="leader" />
                  <dd className="text-fg">{v}</dd>
                </div>
              ))}
              <div className="flex items-baseline gap-2 text-cap">
                <dt className="text-fg-3">Risk engine</dt>
                <span className="leader" />
                <dd className={halted ? 'text-risk-text' : 'text-broker-text'}>{halted ? 'halted' : 'armed'}</dd>
              </div>
            </dl>
            <div className="border-t border-hair p-1.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPalette(true);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-body text-fg-2 hover:bg-white/[0.04] hover:text-fg"
              >
                <Ic n="Command" size={14} /> Command palette <Kbd className="ml-auto">{MOD} K</Kbd>
              </button>
              <p className="px-2.5 pb-1.5 pt-1 text-cap text-fg-3">Live trading is disabled for this workspace.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopBar() {
  const location = useLocation();
  const meta = NAV.find((n) => `/${n.id}` === location.pathname) || NAV[0];
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  const exitDemo = useSim((st) => st.exitDemo);
  const setPalette = useUI((s) => s.setPalette);
  const demo = sim.mode === 'demo';

  return (
    <header className="relative z-30 border-b border-hair bg-bg/95">
      <div className="content-x flex h-14 items-center gap-3">
        <span className="md:hidden">
          <Logo size={26} />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate whitespace-nowrap text-h1 text-fg">{meta.title}</h1>
          <span className="hidden truncate whitespace-nowrap text-body text-fg-3 2xl:inline">· {meta.short}</span>
        </div>

        <button
          type="button"
          onClick={() => setPalette(true)}
          className="hidden h-8 w-[200px] items-center gap-2 rounded-lg border border-hair bg-white/[0.02] px-2.5 text-body text-fg-3 transition hover:border-line hover:text-fg-2 lg:flex 2xl:w-[260px]"
        >
          <Ic n="Search" size={14} />
          <span className="flex-1 truncate whitespace-nowrap text-left">Search, jump, run…</span>
          <Kbd>{MOD} K</Kbd>
        </button>

        <div className="hidden items-center gap-2 rounded-lg px-1 sm:flex">
          <Dot tone={d.status === 'OPEN' ? 'green' : 'neutral'} />
          <span className="text-cap text-fg-2">NSE {d.status === 'OPEN' ? 'open' : d.status === 'PRE-OPEN' ? 'pre-open' : 'closed'}</span>
          <span className="num text-cap text-fg-3">{hms(sim.t)} IST</span>
        </div>

        <Chip tone={sim.halted ? 'rose' : demo ? 'indigo' : 'neutral'} dot pulse={!sim.halted}>
          {sim.halted ? 'Halted' : demo ? 'Replay' : 'Live'}
        </Chip>

        {demo ? (
          <button type="button" onClick={exitDemo} className={cx(btn.base, btn.ghost, btn.md)}>
            <Ic n="X" size={14} /> Exit replay
          </button>
        ) : (
          <button type="button" onClick={() => startDemoWithIntro()} className={cx(btn.base, btn.primary, btn.md, 'font-semibold')}>
            <Ic n="Play" size={14} sw={2.4} /> Run demo
            <span className="num hidden rounded bg-bg/15 px-1 text-cap lg:inline">{mmss(DEMO_END)}</span>
          </button>
        )}

        <Notifications />
        <AccountMenu />
      </div>
      <MobileNav />
    </header>
  );
}

function MobileNav() {
  return (
    <nav className="content-x flex items-center justify-between gap-1 border-t border-hair py-1.5 md:hidden" aria-label="Main">
      {NAV.map((n) => (
        <NavLink
          key={n.id}
          to={`/${n.id}`}
          aria-label={n.label}
          className={({ isActive }) => cx('grid h-10 flex-1 place-items-center rounded-lg transition', isActive ? 'bg-white/[0.05] text-fg' : 'text-fg-3 hover:text-fg-2')}
        >
          <Ic n={n.icon} size={18} />
        </NavLink>
      ))}
    </nav>
  );
}
