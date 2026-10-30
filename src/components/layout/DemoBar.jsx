// Demo cinematics: broadcast lower thirds, a glass control bar, per-beat spotlights,
// and the intro/outro cards. Everything reads the replay clock; nothing changes its script.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSim } from '../../store/useSim.js';
import { useUI, startDemoWithIntro, endIntro } from '../../store/useUI.js';
import { DEMO_STEPS, DEMO_END, KILL_CUE } from '../../sim/index.js';
import { SERIES } from '../../data/backtestData.js';
import { stats } from '../../data/backtest.js';
import { Chip, Ic, Logo, Tip, btn } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { inr, mmss, pct, plural } from '../../lib/format.js';

/** Which panel each beat is about. Times are replay seconds; views follow the replay's own cues. */
export const BEATS = [
  { from: 1.2, to: 6.8, target: 'spot-feed', view: 'activity' },
  { from: 8.2, to: 18.6, target: 'spot-trace', view: 'activity' },
  { from: 19.4, to: 29.6, target: 'spot-pipeline', view: 'architecture' },
  { from: 30.3, to: 37.3, target: 'spot-ticket', view: 'dashboard' },
  { from: 37.9, to: 44.7, target: 'spot-journal', view: 'journal' },
  { from: 45.5, to: 52.8, target: 'spot-ticket', view: 'risk' },
  { from: 56.2, to: 68.9, target: 'spot-feed', view: 'activity' },
  { from: 71.2, to: 79.9, target: 'spot-gauge', view: 'dashboard' },
  { from: 80.0, to: 87.8, target: 'spot-kill', view: 'dashboard' },
  { from: 88.4, to: 95.3, target: 'spot-audit', view: 'risk' },
  { from: 96.0, to: 105, target: 'spot-result', view: 'backtest' },
];

const glass = 'border border-line bg-overlay/80 shadow-pop backdrop-blur-xl';

function LowerThird({ D, halted }) {
  const step = DEMO_STEPS[D.step];
  const killNow = D.killCue && !halted;
  const key = killNow ? 'kill' : `s${D.step}`;
  return (
    <AnimatePresence mode="wait">
      {D.captions && (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 360, damping: 32 } }}
          exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
          className={cx('pointer-events-auto flex max-w-[760px] items-stretch overflow-hidden rounded-xl', glass, killNow && '!border-risk/60')}
        >
          <div className={cx('flex shrink-0 flex-col justify-center border-r px-4 py-2.5', killNow ? 'border-risk/40 bg-risk/15' : 'border-hair bg-white/[0.03]')}>
            <span className={cx('num text-cap', killNow ? 'text-risk-text' : 'text-lime')}>
              {killNow ? 'NOW' : `${String(D.step + 1).padStart(2, '0')} / ${String(DEMO_STEPS.length).padStart(2, '0')}`}
            </span>
            <span className="text-body font-semibold uppercase tracking-[0.14em] text-fg">{killNow ? 'Kill switch' : step.title}</span>
          </div>
          <p className={cx('flex items-center px-4 py-2.5 text-[14px] leading-[20px]', killNow ? 'font-medium text-fg' : 'text-fg')}>
            {killNow ? `Press the kill switch. It auto-presses in ${Math.max(0, Math.ceil(KILL_CUE[1] - D.t))} s.` : step.caption}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IconBtn({ icon, label, onClick, on, className }) {
  return (
    <Tip text={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={on}
        onClick={onClick}
        className={cx('grid h-8 w-8 place-items-center rounded-lg text-fg-2 transition hover:bg-white/[0.06] hover:text-fg', on === false && 'text-fg-mute', className)}
      >
        <Ic n={icon} size={15} />
      </button>
    </Tip>
  );
}

function Controls({ D }) {
  const setPaused = useSim((st) => st.setPaused);
  const exit = useSim((st) => st.exitDemo);
  const setAuto = useSim((st) => st.setAutoFollow);
  const setCaptions = useSim((st) => st.setCaptions);
  const spotlight = useUI((s) => s.spotlight);
  const setSpotlight = useUI((s) => s.setSpotlight);
  return (
    <div className={cx('pointer-events-auto flex h-12 w-full max-w-[880px] items-center gap-3 rounded-2xl px-2', glass)}>
      <Chip tone="indigo" dot pulse={!D.paused} className="ml-1">
        Replay
      </Chip>
      <IconBtn icon={D.paused ? 'Play' : 'Pause'} label={D.paused ? 'Resume' : 'Pause'} onClick={() => setPaused(!D.paused)} />
      <IconBtn icon="RotateCcw" label="Restart" onClick={() => startDemoWithIntro('restart')} />
      <span className="num w-10 text-right text-cap text-fg-2">{mmss(D.t)}</span>
      <div className="relative h-8 min-w-0 flex-1">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-fg-2 transition-[width] duration-200 ease-linear" style={{ width: `${(D.t / DEMO_END) * 100}%` }} />
        </div>
        {DEMO_STEPS.map((st, i) => (
          <span key={st.title} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${(st.at / DEMO_END) * 100}%` }}>
            <Tip text={`${i + 1} · ${st.title}`}>
              <span className={cx('block h-2.5 w-[3px] rounded-full transition-colors', D.t >= st.at ? (i === D.step ? 'bg-lime' : 'bg-fg-2') : 'bg-white/20')} />
            </Tip>
          </span>
        ))}
      </div>
      <span className="num w-10 text-cap text-fg-3">{mmss(DEMO_END)}</span>
      <span className="h-5 w-px bg-hair" />
      <IconBtn icon="Route" label={D.autoFollow ? 'Auto-follow on' : 'Auto-follow off'} on={D.autoFollow} onClick={() => setAuto(!D.autoFollow)} />
      <IconBtn icon={D.captions ? 'Captions' : 'CaptionsOff'} label={D.captions ? 'Captions on' : 'Captions off'} on={D.captions} onClick={() => setCaptions(!D.captions)} />
      <IconBtn icon="Focus" label={spotlight ? 'Spotlight on' : 'Spotlight off'} on={spotlight} onClick={() => setSpotlight(!spotlight)} />
      <IconBtn icon="X" label="Exit replay" onClick={exit} className="mr-1" />
    </div>
  );
}

/** Dims the page to ~40% and lifts the panel the current beat is about. */
function Spotlight({ D }) {
  const on = useUI((s) => s.spotlight);
  const intro = useUI((s) => s.intro);
  const location = useLocation();
  const view = location.pathname.slice(1);
  const beat = BEATS.find((b) => D.t >= b.from && D.t < b.to && b.view === view);
  const active = on && !intro && D.autoFollow && !D.finished && beat;
  const [rect, setRect] = useState(null);
  const scrolled = useRef('');

  useLayoutEffect(() => {
    if (!active) {
      setRect(null);
      return undefined;
    }
    let raf = 0;
    const loop = () => {
      const el = document.getElementById(beat.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((p) => (p && Math.abs(p.top - r.top) < 0.5 && Math.abs(p.left - r.left) < 0.5 && Math.abs(p.width - r.width) < 0.5 && Math.abs(p.height - r.height) < 0.5 ? p : { top: r.top, left: r.left, width: r.width, height: r.height }));
        const key = `${D.id}:${beat.from}`;
        const main = document.getElementById('main');
        if (scrolled.current !== key && main && r.height > 0) {
          scrolled.current = key;
          const m = main.getBoundingClientRect();
          const bottomSafe = m.bottom - 150;
          if (r.bottom > bottomSafe || r.top < m.top + 12) {
            const delta = r.top < m.top + 12 ? r.top - m.top - 16 : Math.min(r.top - m.top - 16, r.bottom - bottomSafe);
            main.scrollBy({ top: delta, behavior: 'smooth' });
          }
        }
      } else setRect(null);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, beat?.target, beat?.from, D.id]);

  const pad = 6;
  return (
    <AnimatePresence>
      {active && rect && (
        <motion.div
          key="spot"
          className="pointer-events-none fixed inset-0 z-[45]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.45 } }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
        >
          <div
            className="absolute rounded-[14px] transition-[top,left,width,height] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]"
            style={{
              top: rect.top - pad,
              left: rect.left - pad,
              width: rect.width + pad * 2,
              height: rect.height + pad * 2,
              boxShadow: '0 0 0 200vmax rgba(7,8,10,0.6), 0 0 0 1px rgba(198,255,0,0.5), 0 0 0 5px rgba(198,255,0,0.07), 0 0 40px rgba(198,255,0,0.14)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Intro() {
  const intro = useUI((s) => s.intro);
  useEffect(() => {
    if (!intro) return undefined;
    const onKey = (e) => e.key === 'Escape' && endIntro();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [intro]);
  return (
    <AnimatePresence>
      {intro && (
        <motion.button
          type="button"
          onClick={endIntro}
          aria-label="Skip intro"
          className="fixed inset-0 z-[80] grid cursor-default place-items-center bg-bg/90 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.1, type: 'spring', stiffness: 220, damping: 26 } }}
            className="flex max-w-[620px] flex-col items-center px-6 text-center"
          >
            <Logo size={56} />
            <p className="mt-6 text-[48px] font-semibold leading-none tracking-[-0.03em] text-fg">Niyam</p>
            <p className="mt-3 text-[17px] leading-[26px] text-fg-2">An agent that trades NIFTY 50 on paper, inside limits it cannot talk its way past.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['1% risk per trade', '25% max position', '−2% daily stop', 'Human kill switch'].map((c) => (
                <span key={c} className="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-body text-fg">
                  {c}
                </span>
              ))}
            </div>
            <p className="num mt-8 text-cap text-fg-3">Replay · Fri 30 Oct 2026 · NSE · paper account NX-PAPER-01 · ₹10,00,000</p>
            <div className="mt-4 h-[2px] w-56 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div className="h-full bg-lime" initial={{ width: '0%' }} animate={{ width: '100%', transition: { duration: 2.9, ease: 'linear' } }} />
            </div>
            <p className="mt-3 text-cap text-fg-3">Click or press Esc to skip</p>
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

const BT = (() => {
  const n = stats(SERIES.portfolio);
  const b = stats(SERIES.bh);
  return { n, b };
})();

function Outro({ D }) {
  const exit = useSim((st) => st.exitDemo);
  const [stay, setStay] = useState(false);
  const [left, setLeft] = useState(12);
  useEffect(() => {
    setStay(false);
    setLeft(12);
  }, [D.id]);
  useEffect(() => {
    if (!D.finished || stay) return undefined;
    const id = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, [D.finished, stay]);
  useEffect(() => {
    if (D.finished && !stay && left <= 0) exit();
  }, [D.finished, stay, left, exit]);
  const s = D.summary;
  if (!D.finished || !s) return null;
  const rows = [
    ['Return', pct(BT.n.cagr, 1, false), pct(BT.b.cagr, 1, false), 'CAGR'],
    ['Sharpe', BT.n.sharpe.toFixed(2), BT.b.sharpe.toFixed(2), ''],
    ['Max drawdown', pct(BT.n.mdd, 1), pct(BT.b.mdd, 1), ''],
  ];
  return (
    <motion.div
      className="pointer-events-auto fixed inset-0 z-[75] grid place-items-center bg-bg/70 px-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4 } }}
    >
      <motion.div
        initial={{ y: 16, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 26, delay: 0.1 } }}
        className="w-full max-w-[720px] overflow-hidden rounded-2xl border border-line bg-overlay/90 shadow-pop backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3 border-b border-hair px-6 py-4">
          <Logo size={28} />
          <div className="flex-1">
            <p className="text-h2 text-fg">Session result</p>
            <p className="text-cap text-fg-3">Fri 30 Oct 2026 · crash into the close · same ₹10,00,000 start</p>
          </div>
          <Chip tone="green" icon="BadgeCheck">
            Loss held inside −2%
          </Chip>
        </div>
        <div className="grid gap-6 px-6 py-5 sm:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-cap text-fg-3">Niyam today</p>
            <p className="num mt-1 text-display text-fg">{pct(s.dayPct)}</p>
            <p className="mt-2 text-body text-fg-2">
              Buy-and-hold NIFTY 50 <span className="num text-risk-text">{pct(s.bhPct)}</span>. The guardrails kept{' '}
              <span className="num text-lime">{inr(s.saved)}</span> an index holder gave back.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Chip>{plural(s.trades, 'trade')}</Chip>
              <Chip tone="rose">{plural(s.stops, 'stop')} hit</Chip>
              <Chip tone="amber">{plural(s.vetoes, 'veto')}</Chip>
              <Chip tone="rose" icon="Power">
                {s.haltedBy === 'demo' ? 'kill switch · auto-press' : s.haltedBy ? 'kill switch pressed' : 'no halt'}
              </Chip>
              <Chip>peak limit use {Math.round(s.maxUsed * 100)}%</Chip>
            </div>
          </div>
          <div className="rounded-xl border border-hair bg-white/[0.02] p-4">
            <p className="text-cap text-fg-3">Four-year backtest · NIFTY 50 · 2022–2025</p>
            <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 text-body">
              <span />
              <span className="text-right text-cap text-fg-3">Niyam</span>
              <span className="text-right text-cap text-fg-3">B&amp;H</span>
              {rows.map(([k, a, b]) => (
                <div key={k} className="contents">
                  <span className="text-fg-2">{k}</span>
                  <span className="num text-right text-fg">{a}</span>
                  <span className="num text-right text-fg-3">{b}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-cap text-fg-3">Illustrative backtest, not a forecast.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-hair px-6 py-3">
          <p className="mr-auto text-cap text-fg-3">{stay ? 'Staying on the replay.' : `Back to the live session in ${Math.max(0, left)} s.`}</p>
          {!stay && (
            <button type="button" className={cx(btn.base, btn.ghost, btn.md)} onClick={() => setStay(true)}>
              Stay here
            </button>
          )}
          <button type="button" className={cx(btn.base, btn.ghost, btn.md)} onClick={() => startDemoWithIntro('restart')}>
            <Ic n="RotateCcw" size={14} /> Replay again
          </button>
          <button type="button" className={cx(btn.base, btn.primary, btn.md, 'font-semibold')} onClick={exit}>
            Back to live <Ic n="ArrowRight" size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DemoLayer() {
  const D = useSim((st) => st.sim.demo);
  const halted = useSim((st) => st.sim.halted);
  const intro = useUI((s) => s.intro);
  return (
    <>
      <Intro />
      {D && (
        <>
          <Spotlight D={D} />
          {!D.finished && !intro && (
            <div className="pointer-events-none absolute inset-x-0 bottom-8 z-50 flex flex-col gap-3 px-4 md:px-6">
              <LowerThird D={D} halted={halted} />
              <div className="flex justify-center">
                <Controls D={D} />
              </div>
            </div>
          )}
          <Outro D={D} />
        </>
      )}
    </>
  );
}
