// Niyam landing page (ported from the jarvis_landing design, copy rewritten for Niyam).
// Lives at #home; the console views sit behind "Open the console".
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BrainCircuit, Check, ChevronDown, CircleAlert, FileText, FlaskConical, Gauge, Github,
  Heart, Loader2, Lock, Newspaper, NotebookPen, Play, Power, Radar, ScrollText, ShieldCheck, Target, TriangleAlert,
} from 'lucide-react';
import { useDerived, useSim } from '../store/useSim.js';
import { inr, pct } from '../lib/format.js';
import { WORLD_DOTS_BASE, WORLD_DOTS_ACCENT } from './world-dots.js';
import { BlurText, CountUp, DotGrid, ShinyText, TiltedCard } from './bits.jsx';

const REPO = 'https://github.com/shreyascoder2006/agent_X';

const scrollToId = (id) => (e) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ── Hero data ───────────────────────────────────────────────────────── */

/** Three orders from today's session, run through the six hard checks. */
const ORDERS = [
  {
    id: 0,
    name: 'BUY 166 INFY',
    initials: 'IN',
    kind: 'Trend-EMA · ₹2,49,000',
    passed: 6,
    verdict: 'approved',
    signals: 'Entry ₹1,500 · stop ₹1,440 (2×ATR) · target ₹1,620',
    evidence: 'Risk ₹9,960 = 1.00% · size 24.9% of equity',
    terms: 'Bracket order NX-24817 filled at ₹1,500.40',
  },
  {
    id: 1,
    name: 'BUY 104 LT',
    initials: 'LT',
    kind: 'Breakout · planner asked 40%',
    passed: 4,
    verdict: 'veto',
    signals: '20-day breakout on 1.6× volume · ₹3,96,500',
    evidence: '39.7% > 25% max position · risk 1.46% > 1%',
    terms: 'Vetoed, resized by code to 65 sh (24.8%, risk 0.91%)',
  },
  {
    id: 2,
    name: 'SUNPHARMA',
    initials: 'SP',
    kind: 'RSI-2 · backtest gate',
    passed: 0,
    verdict: 'gate',
    signals: 'RSI(2) oversold · 3-year backtest requested',
    evidence: 'Sharpe 0.52 vs 0.66 buy-and-hold',
    terms: 'Gate failed: never reaches the broker',
  },
];

const NAV_LINKS = [
  { label: 'Home', id: 'home' },
  { label: 'The Problem', id: 'problem' },
  { label: 'Guardrails', id: 'pillars' },
  { label: 'Three Promises', id: 'explainable' },
  { label: 'How It Works', id: 'how-it-works' },
];

/* ── Brand mark ──────────────────────────────────────────────────────── */

function LogoMark({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M20 2 36 10v10c0 9.2-6.6 15.6-16 18C10.6 35.6 4 29.2 4 20V10L20 2Z" fill="#b8f14d" />
      <path d="M20 8.5 29.5 13v7c0 5.9-4.1 10.1-9.5 11.9C14.1 30.1 10 25.9 10 20v-7L20 8.5Z" fill="#16181d" />
      <path d="M15.5 24V15l9 9v-9" fill="none" stroke="#b8f14d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Corner light beams ──────────────────────────────────────────────── */

function LightBeams() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-56 h-[640px] w-[540px] rotate-[33deg] bg-gradient-to-b from-white/[0.10] via-white/[0.03] to-transparent blur-3xl" />
      <div className="absolute -right-32 -top-56 h-[640px] w-[540px] -rotate-[33deg] bg-gradient-to-b from-white/[0.10] via-white/[0.03] to-transparent blur-3xl" />
      <div className="absolute -top-28 left-[1%] h-[440px] w-[112px] rotate-[31deg] bg-gradient-to-b from-white/[0.14] to-transparent blur-2xl" />
      <div className="absolute -top-44 left-[10%] h-[480px] w-[54px] rotate-[29deg] bg-gradient-to-b from-white/[0.10] to-transparent blur-2xl" />
      <div className="absolute -top-36 left-[19%] h-[380px] w-[26px] rotate-[27deg] bg-gradient-to-b from-white/[0.08] to-transparent blur-xl" />
      <div className="absolute -top-28 right-[1%] h-[440px] w-[112px] -rotate-[31deg] bg-gradient-to-b from-white/[0.14] to-transparent blur-2xl" />
      <div className="absolute -top-44 right-[10%] h-[480px] w-[54px] -rotate-[29deg] bg-gradient-to-b from-white/[0.10] to-transparent blur-2xl" />
      <div className="absolute -top-36 right-[19%] h-[380px] w-[26px] -rotate-[27deg] bg-gradient-to-b from-white/[0.08] to-transparent blur-xl" />
    </div>
  );
}

/* ── Glowing globe (dotted world map + horizon arcs) ─────────────────── */

function GlobeArt() {
  return (
    <svg viewBox="0 0 1600 760" preserveAspectRatio="xMidYMax slice" className="pointer-events-none absolute bottom-0 left-1/2 w-[1600px] max-w-none -translate-x-1/2" aria-hidden="true">
      <defs>
        <radialGradient id="gGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#b8f14d" stopOpacity="0.30" />
          <stop offset="55%" stopColor="#b8f14d" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#b8f14d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gBloomCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e9ffb0" stopOpacity="0.5" />
          <stop offset="45%" stopColor="#c6f96a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#b8f14d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gArc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b8f14d" stopOpacity="0" />
          <stop offset="0.35" stopColor="#b8f14d" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#e7ffa3" />
          <stop offset="0.65" stopColor="#b8f14d" stopOpacity="0.9" />
          <stop offset="1" stopColor="#b8f14d" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="gPlanet" cx="50%" cy="8%" r="90%">
          <stop offset="0%" stopColor="#131a09" />
          <stop offset="45%" stopColor="#0c1008" />
          <stop offset="100%" stopColor="#070906" />
        </radialGradient>
        <linearGradient id="gTerminator" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.45" stopColor="#000" stopOpacity="0.55" />
          <stop offset="0.72" stopColor="#040604" stopOpacity="0.4" />
          <stop offset="1" stopColor="#d7ff8a" stopOpacity="0.07" />
        </linearGradient>
        <linearGradient id="gBeam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#d7ff8a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#d7ff8a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gMaskFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.55" stopColor="#999" />
          <stop offset="1" stopColor="#111" />
        </linearGradient>
        <linearGradient id="gMaskSoft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.55" stopColor="#e8e8e8" />
          <stop offset="1" stopColor="#777" />
        </linearGradient>
        <mask id="mDots">
          <rect x="0" y="0" width="1600" height="760" fill="url(#gMaskFade)" />
        </mask>
        <mask id="mSoft">
          <rect x="0" y="0" width="1600" height="760" fill="url(#gMaskSoft)" />
        </mask>
        <pattern id="gDots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#9ecb4f" fillOpacity="0.3" />
        </pattern>
        <clipPath id="planetClip">
          <ellipse cx="800" cy="1760" rx="1180" ry="1330" />
        </clipPath>
        <filter id="fBlur40" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="42" />
        </filter>
        <filter id="fBlur24" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="24" />
        </filter>
        <filter id="fBlur8" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <ellipse cx="800" cy="500" rx="880" ry="380" fill="url(#gGlow)" filter="url(#fBlur40)" />
      <ellipse cx="800" cy="1760" rx="1180" ry="1330" fill="url(#gPlanet)" />
      <ellipse cx="800" cy="1760" rx="1180" ry="1330" fill="url(#gDots)" mask="url(#mDots)" />
      <g clipPath="url(#planetClip)" mask="url(#mSoft)">
        <g className="globe-spin">
          {[0, 1600].map((offset) => (
            <g key={offset} transform={`translate(${offset} 0)`}>
              <path d={WORLD_DOTS_BASE} fill="#8fbe45" fillOpacity="0.5" />
              <path d={WORLD_DOTS_ACCENT} fill="#d7ff8a" fillOpacity="0.85" />
            </g>
          ))}
        </g>
        <g className="globe-terminator">
          <rect x="0" y="380" width="620" height="460" fill="url(#gTerminator)" />
        </g>
      </g>
      <ellipse cx="800" cy="1760" rx="1180" ry="1330" fill="none" stroke="#b8f14d" strokeWidth="14" opacity="0.22" filter="url(#fBlur8)" />
      <ellipse cx="800" cy="1760" rx="1180" ry="1330" fill="none" stroke="url(#gArc)" strokeWidth="2.5" />
      <ellipse cx="800" cy="448" rx="330" ry="105" fill="url(#gBloomCore)" filter="url(#fBlur24)" />
      <g filter="url(#fBlur8)" opacity="0.5">
        <rect x="396" y="240" width="70" height="258" fill="url(#gBeam)" />
        <rect x="596" y="172" width="64" height="264" fill="url(#gBeam)" />
        <rect x="772" y="168" width="56" height="264" fill="url(#gBeam)" />
        <rect x="940" y="172" width="64" height="264" fill="url(#gBeam)" />
        <rect x="1134" y="240" width="70" height="258" fill="url(#gBeam)" />
      </g>
      <g fill="none" strokeLinecap="round">
        <g stroke="#b8f14d" opacity="0.2" strokeWidth="5" filter="url(#fBlur8)">
          <path d="M320 545 Q 610 300 900 435" />
          <path d="M520 468 Q 810 240 1100 474" />
          <path d="M700 435 Q 990 262 1280 545" />
          <path d="M320 545 Q 510 382 700 435" />
          <path d="M900 435 Q 1090 382 1280 545" />
        </g>
        <g stroke="#c9f06d" strokeWidth="1.4">
          <path d="M320 545 Q 610 300 900 435" opacity="0.5" />
          <path d="M520 468 Q 810 240 1100 474" opacity="0.55" />
          <path d="M700 435 Q 990 262 1280 545" opacity="0.5" />
          <path d="M320 545 Q 510 382 700 435" opacity="0.35" />
          <path d="M900 435 Q 1090 382 1280 545" opacity="0.35" />
        </g>
      </g>
      {[
        { x: 320, y: 545 },
        { x: 520, y: 468 },
        { x: 700, y: 435 },
        { x: 900, y: 435 },
        { x: 1100, y: 474 },
        { x: 1280, y: 545 },
      ].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="12" fill="#d7ff8a" opacity="0.3" filter="url(#fBlur8)" />
          <circle cx={p.x} cy={p.y} r="4.2" fill="#eeffc4">
            {i % 2 === 0 && <animate attributeName="opacity" values="1;0.55;1" dur={`${2.8 + i * 0.5}s`} repeatCount="indefinite" />}
          </circle>
        </g>
      ))}
      <g stroke="#b8f14d" strokeWidth="1.1" opacity="0.3" fill="none">
        <path d="M520 585 Q 640 540 770 555" />
        <path d="M770 555 Q 910 562 1035 600" />
        <path d="M655 675 Q 795 715 935 682" />
        <path d="M405 662 Q 465 618 520 585" />
        <path d="M1035 600 Q 1110 630 1180 672" />
      </g>
      {[
        { x: 520, y: 585 },
        { x: 770, y: 555 },
        { x: 1035, y: 600 },
        { x: 655, y: 675 },
        { x: 935, y: 682 },
        { x: 405, y: 662 },
        { x: 1180, y: 672 },
      ].map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="7" fill="#b8f14d" opacity="0.15" />
          <circle cx={n.x} cy={n.y} r="3" fill="#d7ff8a">
            {i % 3 === 0 && <animate attributeName="r" values="3;5.4;3" dur={`${2.6 + i * 0.4}s`} repeatCount="indefinite" />}
          </circle>
        </g>
      ))}
    </svg>
  );
}

/* ── Pre-trade check widget ──────────────────────────────────────────── */

const VERDICT = {
  approved: { badge: 'bg-volt text-[#101502]', bar: 'bg-volt', label: 'APPROVED' },
  veto: { badge: 'bg-red-500/90 text-white', bar: 'bg-red-500', label: 'VETO · RESIZED' },
  gate: { badge: 'bg-amber-400 text-[#231a02]', bar: 'bg-amber-400', label: 'GATE FAILED' },
};

function RiskCheckWidget() {
  const [order, setOrder] = useState(ORDERS[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [display, setDisplay] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (phase !== 'done') return undefined;
    const start = performance.now();
    let raf = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / 900);
      setDisplay(Math.round((1 - (1 - p) ** 3) * order.passed));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, order.passed]);
  const tone = VERDICT[order.verdict];
  const run = () => {
    if (phase === 'analyzing') return;
    setPhase('analyzing');
    setDisplay(0);
    timer.current = setTimeout(() => setPhase('done'), 1400);
  };
  const select = (o) => {
    setOrder(o);
    setMenuOpen(false);
    setPhase('idle');
    setDisplay(0);
  };
  return (
    <div className="w-full max-w-[350px] rounded-3xl border border-white/10 bg-[#1b1e24]/90 p-5 text-left shadow-2xl shadow-black/60 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium tracking-[0.14em] text-zinc-400">PROPOSED ORDER</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/10"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-volt text-[8px] font-bold text-[#101502]">{order.initials}</span>
            {order.kind}
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </button>
          {menuOpen && (
            <>
              <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
              <div role="listbox" className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#22262e] p-1.5 shadow-2xl shadow-black/70">
                {ORDERS.map((o) => (
                  <button
                    type="button"
                    key={o.id}
                    role="option"
                    aria-selected={o.id === order.id}
                    onClick={() => select(o)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/10 ${o.id === order.id ? 'bg-white/10' : ''}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-volt to-volt-deep text-[10px] font-bold text-[#101502]">{o.initials}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-white">{o.name}</span>
                      <span className="block text-[10px] text-zinc-400">{o.kind}</span>
                    </span>
                    {o.id === order.id && <Check className="ml-auto h-3.5 w-3.5 text-volt" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{order.name}</p>
      <div className="relative my-4">
        <div className="h-px bg-white/10" />
        <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#22262e]">
          <ArrowRight className="h-3.5 w-3.5 rotate-90 text-zinc-400" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium tracking-[0.14em] text-zinc-400">RISK ENGINE · 6 HARD CHECKS</p>
        {phase === 'done' && <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${tone.badge}`}>{tone.label}</span>}
      </div>
      {phase === 'analyzing' ? (
        <p className="mt-1.5 flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-300">
          <Loader2 className="h-5 w-5 animate-spin text-volt" />
          Checking limits…
        </p>
      ) : phase === 'done' ? (
        <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">
          {display}
          <span className="text-base font-semibold text-zinc-500"> / 6 passed</span>
        </p>
      ) : (
        <p className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-600">
          — <span className="text-base font-semibold text-zinc-700"> / 6</span>
        </p>
      )}
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-[width] duration-200 ease-out ${tone.bar} ${phase !== 'done' ? 'opacity-30' : ''}`} style={{ width: phase === 'done' ? `${(display / 6) * 100}%` : '0%' }} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 text-[10px]">
        <span className="min-w-0 truncate text-zinc-400">{phase === 'done' ? order.evidence : order.signals}</span>
        <span className="flex shrink-0 items-center gap-1 font-medium text-volt">
          Code, not prompt <Check className="h-3 w-3" />
        </span>
      </div>
      {phase === 'done' && <p className="mt-2 rounded-xl bg-volt/10 px-3 py-2 text-[11px] text-volt-soft">Outcome → {order.terms}</p>}
      <button
        type="button"
        onClick={run}
        disabled={phase === 'analyzing'}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-volt py-3 text-sm font-bold text-[#101502] transition hover:bg-volt-soft disabled:opacity-70"
      >
        {phase === 'done' ? 'Run the check again' : 'Run the risk check'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── Live paper-account card (reads the running simulation) ──────────── */

function LiveEquityCard() {
  const d = useDerived();
  const positions = useSim((st) => st.sim.positions.length);
  const halted = useSim((st) => st.sim.halted);
  const chips = [
    { i: 'TE', g: 'from-lime-300 to-green-600', t: 'Trend-EMA' },
    { i: 'R2', g: 'from-indigo-400 to-violet-600', t: 'RSI-2' },
    { i: 'BO', g: 'from-emerald-400 to-teal-600', t: 'Breakout' },
    { i: 'SO', g: 'from-amber-300 to-orange-500', t: 'Sit out' },
  ];
  return (
    <div className="w-full max-w-[300px] rounded-3xl border border-white/10 bg-[#1b1e24]/90 p-5 text-left shadow-2xl shadow-black/60 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-[0.14em] text-zinc-400">PAPER EQUITY · NX-PAPER-01</p>
        <p className={`flex items-center gap-1.5 text-[11px] font-semibold ${halted ? 'text-red-400' : 'text-volt'}`}>
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full animate-ping-soft rounded-full ${halted ? 'bg-red-400' : 'bg-volt'}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${halted ? 'bg-red-400' : 'bg-volt'}`} />
          </span>
          {halted ? 'Halted' : 'Live'}
        </p>
      </div>
      <p className="mt-2 text-[32px] font-extrabold tabular-nums tracking-tight text-white">{inr(d.equity)}</p>
      <p className="mt-1 text-xs text-zinc-400">
        <span className={d.dayPnl >= 0 ? 'text-volt' : 'text-red-400'}>
          {inr(d.dayPnl, 0, true)} ({pct(d.dayPct)})
        </span>{' '}
        today · {positions} of 4 slots · {Math.round(d.used * 100)}% of the −2% limit used
      </p>
      <div className="mt-4 flex items-center">
        <div className="flex -space-x-2.5">
          {chips.map((a) => (
            <span key={a.i} title={a.t} className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${a.g} text-[10px] font-bold text-white ring-2 ring-[#1b1e24]`}>
              {a.i}
            </span>
          ))}
        </div>
        <span className="ml-2 rounded-full bg-volt px-2.5 py-1 text-[11px] font-bold text-[#101502]">4 playbooks</span>
      </div>
    </div>
  );
}

function BuiltWithRow() {
  return (
    <div className="relative z-10 mx-auto mt-7 w-full max-w-6xl px-6 pb-4 xl:mt-8">
      <p className="text-center text-[11px] font-semibold tracking-[0.3em] text-zinc-500">PAPER ONLY · LIVE BROKER ENDPOINTS BLOCKED BY AN ALLOWLIST</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-zinc-500">
        <span className="text-lg font-extrabold tracking-tight transition hover:text-zinc-300">LangGraph</span>
        <span className="font-display text-lg font-semibold italic transition hover:text-zinc-300">Claude Sonnet 5.5</span>
        <span className="text-base font-bold tracking-[0.22em] transition hover:text-zinc-300">HAIKU 5.5</span>
        <span className="text-lg font-semibold transition hover:text-zinc-300">vectorbt</span>
        <span className="flex items-center gap-1.5 text-lg font-bold transition hover:text-zinc-300">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current" />
          Qdrant
        </span>
        <span className="text-base font-semibold tracking-widest transition hover:text-zinc-300">NSE NIFTY 50</span>
        <span className="text-lg font-extrabold tracking-tight transition hover:text-zinc-300">Postgres</span>
      </div>
    </div>
  );
}

function Hero({ openConsole, watchDemo }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <section id="home" className="relative flex min-h-[100svh] flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #1d1f23 0%, #16181c 45%, #0e0f12 100%)' }}>
      <div className="absolute inset-0">
        <DotGrid />
      </div>
      <LightBeams />
      <GlobeArt />
      <div className="relative z-10 flex flex-1 flex-col">
        <header className="relative z-30 flex items-center justify-between px-5 py-4 sm:px-8 xl:px-12 xl:py-5">
          <a href="#home" onClick={scrollToId('home')} className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-xl font-extrabold tracking-tight text-white">niyam</span>
          </a>
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-md xl:flex">
            {NAV_LINKS.map((l, i) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={scrollToId(l.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${i === 0 ? 'bg-white/10 font-semibold text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-5 lg:flex">
            <a href={REPO} target="_blank" rel="noreferrer" className="text-sm font-medium text-zinc-300 transition hover:text-white">
              GitHub
            </a>
            <button type="button" onClick={openConsole} className="group flex items-center gap-2 rounded-full bg-volt px-5 py-2.5 text-sm font-bold text-[#101502] transition hover:bg-volt-soft">
              Open the console
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-5 bg-current transition ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-5 bg-current transition ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-current transition ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </div>
          </button>
          {mobileOpen && (
            <div className="absolute right-4 top-[72px] z-40 w-64 rounded-3xl border border-white/10 bg-[#1d2026]/95 p-3 shadow-2xl shadow-black/70 backdrop-blur-xl lg:hidden">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={(e) => {
                    setMobileOpen(false);
                    scrollToId(l.id)(e);
                  }}
                  className="block rounded-2xl px-4 py-3 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </a>
              ))}
              <button type="button" onClick={openConsole} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-volt px-4 py-3 text-sm font-bold text-[#101502]">
                Open the console <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </header>

        <div className="relative z-10 flex grow flex-col items-center justify-center px-5 pb-2 pt-6 text-center sm:px-8 xl:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md"
          >
            <ShieldCheck className="h-4 w-4 text-volt" />
            <ShinyText text="Paper trading only · NSE NIFTY 50 · AgentX 2026 · PS-02" className="text-xs font-medium text-zinc-300/85" speed={5} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="mt-3 text-[clamp(3.4rem,12vw,9rem)] font-black leading-[0.88] tracking-[-0.03em] text-white"
          >
            NIY<span className="bg-gradient-to-b from-volt-soft to-volt-deep bg-clip-text text-transparent">AM</span>
          </motion.h1>
          <div className="mt-4 max-w-xl">
            <BlurText
              text="An agentic paper-trading bot for NSE NIFTY 50. It reads prices and news, tags the regime, picks a backtested strategy and sizes every trade from 1% risk, inside hard limits the language model cannot talk its way past."
              className="text-base text-zinc-400 sm:text-lg"
              delay={28}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <button type="button" onClick={openConsole} className="group flex items-center gap-2 rounded-full bg-volt px-7 py-3.5 text-sm font-bold text-[#101502] transition hover:bg-volt-soft">
              Open the live console
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={watchDemo}
              className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                <Play className="ml-0.5 h-3 w-3 fill-white" />
              </span>
              Watch the 1:52 replay
            </button>
          </motion.div>
        </div>

        <div className="relative z-10 mt-8 flex flex-1 flex-col items-center justify-center gap-6 px-5 sm:px-8 xl:mt-4 xl:flex-row xl:items-center xl:justify-between xl:gap-0">
          <motion.div initial={{ opacity: 0, x: -32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.35 }} className="animate-floaty xl:ml-[3%]">
            <LiveEquityCard />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.35 }} className="animate-floaty-slow xl:mr-[3%]">
            <RiskCheckWidget />
          </motion.div>
        </div>
        <BuiltWithRow />
      </div>
    </section>
  );
}

/* ── The problem in numbers ──────────────────────────────────────────── */

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.7, delay },
});

function Connector({ up = false }) {
  return (
    <div className={`flex flex-col items-center ${up ? 'flex-col-reverse' : ''}`} aria-hidden="true">
      <span className="h-9 w-px bg-gradient-to-b from-volt/60 to-volt/15" />
      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-volt shadow-[0_0_10px_rgba(184,241,77,0.9)]" />
    </div>
  );
}

function TickStrip() {
  return <div aria-hidden="true" className="h-9 min-w-[12px] flex-1 rounded-[3px] bg-[repeating-linear-gradient(90deg,rgba(184,241,77,0.55)_0px,rgba(184,241,77,0.55)_3px,transparent_3px,transparent_11px)]" />;
}

function Cluster({ title, desc, children, delay = 0 }) {
  return (
    <motion.div {...fade(delay)} className="mx-auto max-w-xs text-center">
      <h3 className="text-base font-bold text-white sm:text-lg">{title}</h3>
      <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">{desc}</p>
      <div className="mt-4 font-display text-6xl font-medium tracking-tight text-volt [text-shadow:0_0_36px_rgba(184,241,77,0.35)] sm:text-7xl">{children}</div>
      <Connector />
    </motion.div>
  );
}

const PILL = 'whitespace-nowrap rounded-2xl border border-volt/30 bg-gradient-to-b from-volt/15 to-volt/[0.04] px-5 py-2.5 text-lg font-bold text-white shadow-[0_0_34px_-10px_rgba(184,241,77,0.6)] sm:px-8 sm:py-3 sm:text-2xl';

function Problem() {
  return (
    <section id="problem" className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#050505]">
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-volt/[0.07] blur-[140px]" />
      <span aria-hidden="true" className="absolute right-[9%] top-[10%] h-3 w-3 rotate-45 border border-volt/25" />
      <span aria-hidden="true" className="absolute left-[6%] top-[46%] h-4 w-4 rotate-45 border border-volt/15" />
      <span aria-hidden="true" className="absolute bottom-[24%] left-[14%] h-2.5 w-2.5 rotate-45 bg-volt/10" />
      <span aria-hidden="true" className="absolute bottom-[16%] right-[7%] h-5 w-5 rotate-45 border border-volt/10" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pt-12 sm:px-8 sm:pt-14">
        <div className="text-center">
          <motion.p {...fade()} className="text-xs font-semibold tracking-[0.3em]">
            <ShinyText text="· THE PROBLEM IN NUMBERS" className="font-semibold text-volt/90" speed={4} />
          </motion.p>
          <motion.h2 {...fade(0.06)} className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Most retail traders lose to things a rulebook stops. Niyam is the rulebook, with a kill switch.
          </motion.h2>
        </div>
        <div className="mx-auto grid w-full max-w-4xl flex-1 items-center gap-8 py-6 sm:grid-cols-2 lg:gap-16">
          <Cluster
            title="Nine in ten derivatives traders lost money"
            desc="SEBI's study of FY22 to FY24 found 93% of individual F&O traders made a loss, about ₹2 lakh each on average. Oversized positions and no stop do most of the damage."
          >
            <CountUp to={93} suffix="%" duration={2.2} />
          </Cluster>
          <Cluster
            title="One trade should never risk more than 1% of the account"
            desc="Niyam sizes every order as 1% of start-of-day equity ÷ the stop distance, capped at 25% of equity. When the planner asked for a 40% position in LT, code vetoed it."
            delay={0.1}
          >
            <CountUp to={1} suffix="% risk" duration={1.6} />
          </Cluster>
        </div>
      </div>

      <motion.div {...fade(0.15)} className="relative z-10 flex items-center gap-3 sm:gap-5">
        <TickStrip />
        <div className={PILL}>1% per trade</div>
        <TickStrip />
        <div className={PILL}>25% max position</div>
        <TickStrip />
        <div className={PILL}>−2% day stop</div>
        <TickStrip />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-12 pt-5 sm:px-8 sm:pb-14">
        <motion.div {...fade(0.22)} className="mx-auto max-w-md text-center">
          <Connector up />
          <h3 className="mt-3 text-base font-bold text-white sm:text-lg">A bad day stops at −2%, not at the bottom</h3>
          <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">
            At 75% of the daily limit new entries are blocked. At −2% the risk engine cancels every order, flattens every position and locks the broker until a human re-arms in two steps.
          </p>
          <div className="mt-4 font-display text-6xl font-medium tracking-tight text-volt [text-shadow:0_0_36px_rgba(184,241,77,0.35)] sm:text-7xl">
            −<CountUp to={2} suffix="%" duration={1.6} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Guardrails bento ────────────────────────────────────────────────── */

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.65, delay },
});

function CellGlow() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_20%_112%,rgba(184,241,77,0.17),transparent_58%)]" />;
}

const CELL = 'relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b0d0a] p-5 sm:p-6';

function RiskEngineDiagram() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center py-2">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-volt/45 bg-volt/10 text-sm font-black text-volt shadow-[0_0_34px_-6px_rgba(184,241,77,0.7)]">LLM</div>
      <span aria-hidden="true" className="h-7 w-px border-l border-dashed border-volt/35" />
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.12] bg-white/[0.05]">
        <ShieldCheck className="h-5 w-5 text-volt" />
      </div>
      <svg viewBox="0 0 200 52" className="h-12 w-full max-w-[280px]" fill="none" aria-hidden="true">
        <path d="M100 0v12M100 12 30 52M100 12v40M100 12l70 40" stroke="rgba(184,241,77,0.3)" strokeWidth="1.4" strokeDasharray="3 5" />
        <circle cx="100" cy="12" r="2" fill="rgba(184,241,77,0.7)" />
      </svg>
      <div className="flex w-full max-w-[280px] items-start justify-between px-1">
        {[
          { icon: Target, label: '1% per trade' },
          { icon: Gauge, label: '25% max size' },
          { icon: Power, label: '−2% day stop' },
        ].map((n) => (
          <div key={n.label} className="flex flex-col items-center gap-2">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/[0.12] bg-white/[0.05]">
              <n.icon className="h-5 w-5 text-zinc-200" />
            </div>
            <span className="text-[9px] font-medium text-zinc-500">{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GateStack() {
  return (
    <div className="relative mt-1 h-[118px]">
      <div aria-hidden="true" className="absolute inset-x-8 top-0 h-14 rounded-xl border border-white/[0.08] bg-white/[0.03]" />
      <div aria-hidden="true" className="absolute inset-x-4 top-2.5 h-14 rounded-xl border border-white/[0.08] bg-white/[0.04]" />
      <div className="absolute inset-x-0 top-5 flex h-[72px] items-center gap-3 rounded-xl border border-white/[0.12] bg-[#141712] p-3 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-amber-400/25 bg-amber-400/10">
          <TriangleAlert className="h-4 w-4 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white">SUNPHARMA · RSI-2 gate failed</p>
          <p className="truncate text-[10px] text-zinc-500">Sharpe 0.52 vs 0.66 buy-and-hold · not traded</p>
        </div>
        <Radar className="h-4 w-4 shrink-0 text-volt" />
      </div>
    </div>
  );
}

function PlaybookMini() {
  const bars = [
    { label: 'Trend-EMA · win rate', pct: 48 },
    { label: 'RSI-2 · win rate', pct: 65 },
    { label: 'Breakout · win rate', pct: 50 },
  ];
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#101310]">
      <div className="flex items-center gap-2 border-b border-white/[0.08] px-3 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-volt" />
        <p className="text-[10px] font-medium text-zinc-400">Niyam · 4-year backtest · NIFTY 50</p>
        <span className="ml-auto rounded-full bg-volt/15 px-2 py-0.5 text-[9px] font-bold text-volt">2022–2025</span>
      </div>
      <div className="flex items-center gap-4 p-3.5">
        <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle cx="32" cy="32" r={r} fill="none" stroke="#b8f14d" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - 0.542)} />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black leading-none text-white">
            54%<span className="text-[10px] font-semibold text-zinc-500"> win rate · 212 trades</span>
          </p>
          <div className="mt-2 space-y-1.5">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-[8.5px] text-zinc-500">
                  <span>{b.label}</span>
                  <span>{b.pct}%</span>
                </div>
                <div className="mt-0.5 h-1 rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-volt/80" style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 px-3.5 pb-3">
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[8.5px] text-zinc-400">Claude Sonnet 5.5 · planner</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[8.5px] text-zinc-400">Haiku 5.5 · news</span>
      </div>
    </div>
  );
}

function AuditVisual() {
  return (
    <div className="relative flex flex-1 flex-col justify-center space-y-2 py-1">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span className="font-mono text-zinc-300">VETO · LT</span>
        </div>
        <span className="font-mono text-[9px] text-zinc-500">39.7% &gt; 25% cap</span>
        <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[8.5px] font-bold text-red-300">RESIZED</span>
      </div>
      <div className="flex items-center justify-center">
        <span className="h-3 w-px border-l border-dashed border-volt/40" />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-volt/25 bg-volt/[0.05] px-3 py-2 text-[10px] shadow-[0_0_20px_-5px_rgba(184,241,77,0.15)]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-ping-soft rounded-full bg-volt" />
          <span className="font-mono font-semibold text-white">HALT · kill switch</span>
        </div>
        <span className="font-mono text-[9px] text-zinc-400">flat in 1.4 s</span>
        <span className="rounded bg-volt px-1.5 py-0.5 text-[8.5px] font-bold text-[#101502]">LOCKED</span>
      </div>
      <p className="pt-1 text-center text-[9px] font-bold tracking-[0.25em] text-volt/60">THE LLM PROPOSES · CODE DECIDES</p>
    </div>
  );
}

function Pillars() {
  return (
    <section id="pillars" className="relative flex min-h-[100svh] flex-col overflow-hidden bg-coal">
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-volt/[0.06] blur-[140px]" />
      <span aria-hidden="true" className="absolute left-[8%] top-[12%] h-3 w-3 rotate-45 border border-volt/20" />
      <span aria-hidden="true" className="absolute right-[10%] top-[40%] h-4 w-4 rotate-45 border border-volt/15" />
      <span aria-hidden="true" className="absolute bottom-[10%] left-[45%] h-2.5 w-2.5 rotate-45 bg-volt/10" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-10 sm:px-8 sm:py-12">
        <div className="text-center">
          <motion.p {...fadeIn()} className="text-xs font-semibold tracking-[0.3em]">
            <ShinyText text="· GUARDRAILS FIRST" className="font-semibold text-volt/90" speed={4} />
          </motion.p>
          <motion.h2 {...fadeIn(0.06)} className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            A planner that reasons, and a risk engine it cannot override.
          </motion.h2>
        </div>
        <div className="mt-8 grid flex-1 gap-4 sm:gap-5 lg:grid-cols-3 lg:grid-rows-2">
          <motion.article {...fadeIn(0.1)} className={`${CELL} lg:row-span-2`}>
            <CellGlow />
            <RiskEngineDiagram />
            <h3 className="relative mt-4 text-base font-bold leading-snug text-white">Hard-coded risk engine with veto power</h3>
            <p className="relative mt-2 text-xs leading-relaxed text-zinc-400">
              Six checks run in plain Python before any order leaves: risk per trade, position size, open slots, daily headroom, results within two days and a paper-only endpoint. Only the risk engine holds broker keys, and only paper ones.
            </p>
          </motion.article>
          <motion.article {...fadeIn(0.18)} className={CELL}>
            <CellGlow />
            <GateStack />
            <h3 className="relative mt-5 text-base font-bold leading-snug text-white">Regime tags and a backtest gate</h3>
            <p className="relative mt-2 text-xs leading-relaxed text-zinc-400">
              ADX and India VIX tag each 15-minute loop as trend, range or volatile. A strategy only trades if its 3-year backtest beats buy-and-hold; above VIX 16 it sits out.
            </p>
          </motion.article>
          <motion.article {...fadeIn(0.26)} className={`${CELL} lg:col-start-2 lg:row-start-2`}>
            <CellGlow />
            <AuditVisual />
            <h3 className="relative mt-4 text-base font-bold leading-snug text-white">Kill switch, 2-step re-arm and an audit log</h3>
            <p className="relative mt-2 text-xs leading-relaxed text-zinc-400">
              One press cancels, flattens and locks. Re-arming needs a reviewed checkbox and a second confirm. Every veto, block, retry and halt lands in the audit log.
            </p>
          </motion.article>
          <motion.article {...fadeIn(0.34)} className={`${CELL} lg:col-start-3 lg:row-span-2 lg:row-start-1`}>
            <CellGlow />
            <PlaybookMini />
            <div className="flex-1" />
            <h3 className="relative mt-4 text-base font-bold leading-snug text-white">Four playbooks and a journal for every trade</h3>
            <p className="relative mt-2 text-xs leading-relaxed text-zinc-400">
              Trend-EMA, RSI-2 mean reversion, 20-day breakouts, or sit out. Claude Sonnet 5.5 picks one and writes a plain-language journal entry for every trade, checked against the ledger.
            </p>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

/* ── The three promises ──────────────────────────────────────────────── */

const PROMISES = [
  { icon: FileText, title: 'The model never sizes a trade', desc: 'Quantity is 1% of equity ÷ stop distance, capped at 25%, computed in code. Claude proposes the setup; it cannot change a limit.' },
  { icon: ShieldCheck, title: 'Protect before money moves', desc: 'Six hard checks run before every bracket order. Oversized requests are vetoed and resized, never quietly passed.' },
  { icon: NotebookPen, title: 'Every trade has a why', desc: 'A plain-language journal entry for every trade and every sit-out, with entry, stop, target and the news that moved it.' },
  { icon: ScrollText, title: 'Every veto and halt is logged', desc: 'The audit log records each veto, block, retry, limit warning and halt with who did it and when.' },
];

const WHY = ['Price above the 20- and 50-period EMAs with ADX 31', 'Deal headline scored +0.62 by Haiku 5.5', 'Backtest gate: Sharpe 1.12 vs 0.61 buy-and-hold', 'HDFCBANK skipped: results due tomorrow'];
const CAUGHT = ['LT asked for 39.7% of equity: vetoed, resized to 24.8%', 'SUNPHARMA RSI-2 failed the gate: not traded'];

function TicketRing() {
  const r = 58;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#b8f14d"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-black tracking-tight text-white">6/6</p>
        <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500">CHECKS</p>
      </div>
    </div>
  );
}

function TradeMock({ openJournal }) {
  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-8 rounded-[48px] bg-orange-500/20 blur-[70px]" />
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="relative">
        <TiltedCard rotateAmplitude={5} glareOpacity={0.1} className="overflow-hidden rounded-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.12] bg-[#141619] shadow-2xl shadow-black/70">
            <div className="flex items-center gap-2 border-b border-white/[0.08] px-5 py-3.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <p className="ml-3 text-xs font-medium text-zinc-500">Niyam · Trade journal · T-0417</p>
              <span className="ml-auto rounded-full bg-volt/15 px-2.5 py-1 text-[10px] font-bold text-volt">PAPER</span>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <TicketRing />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-volt to-volt-deep text-xs font-bold text-[#101502]">IN</span>
                    <div>
                      <p className="text-sm font-bold text-white">BUY 166 INFY · Trend-EMA</p>
                      <p className="text-[11px] text-zinc-500">Entry ₹1,500.40 · stop ₹1,440 · target ₹1,620</p>
                    </div>
                  </div>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {['Risk ₹9,960 · 1.00%', 'Size 24.9%', 'Regime TREND'].map((chip) => (
                      <span key={chip} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-zinc-300">
                        {chip}
                      </span>
                    ))}
                    <span className="rounded-full bg-volt px-2.5 py-1 text-[10px] font-bold text-[#101502]">APPROVED</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-volt">WHY IT TRADED</p>
                  <ul className="mt-3 space-y-2.5">
                    {WHY.map((s) => (
                      <li key={s} className="flex items-start gap-2">
                        <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-volt" />
                        <span className="text-[11px] leading-relaxed text-zinc-300">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-amber-400">WHAT THE RISK ENGINE CAUGHT</p>
                  <ul className="mt-3 space-y-2.5">
                    {CAUGHT.map((s) => (
                      <li key={s} className="flex items-start gap-2">
                        <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span className="text-[11px] leading-relaxed text-zinc-300">{s}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-xl bg-white/[0.04] px-3 py-2 text-[10px] leading-relaxed text-zinc-400">
                    Why this matters: a 40% position sized off a 2×ATR stop risks 1.46% of the account, nearly half again the 1% budget.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-volt/20 bg-volt/[0.06] p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-volt">WRITTEN BY CLAUDE · CHECKED AGAINST THE LEDGER</p>
                  <p className="mt-1 text-sm font-bold text-white">I am wrong below ₹1,440, a ₹9,960 loss, 1% of the account.</p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">Target ₹1,620, twice the risk. Bracket order NX-24817 filled ₹1,500.40.</p>
                </div>
                <button type="button" onClick={openJournal} className="group flex items-center justify-center gap-1.5 rounded-full bg-volt px-5 py-2.5 text-xs font-bold text-[#101502] transition hover:bg-volt-soft">
                  Open the journal
                  <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </TiltedCard>
      </motion.div>
    </div>
  );
}

function Explainable({ openJournal }) {
  const v = (delay) => ({ initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.55, delay } });
  return (
    <section id="explainable" className="relative flex min-h-[100svh] items-center overflow-hidden bg-coal">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        <div>
          <motion.p {...v(0)} className="text-xs font-bold tracking-[0.3em]">
            <ShinyText text="THE THREE PROMISES" className="font-bold text-orange-400/85" speed={4} />
          </motion.p>
          <motion.h2 {...v(0.06)} className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Propose. Check.
            <br />
            Then{' '}
            <span className="bg-gradient-to-b from-orange-300 to-orange-600 bg-clip-text text-transparent">explain.</span>
          </motion.h2>
          <motion.p {...v(0.12)} className="mt-5 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Claude Sonnet 5.5 reasons about the market and proposes trades. Hard-coded rules decide what reaches the broker, and every order, veto and halt is written down in plain language. Paper trading only: no live order can leave the allowlist.
          </motion.p>
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5">
            {PROMISES.map((p, i) => (
              <motion.div key={p.title} {...v(0.1 + i * 0.06)}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/10 text-orange-400">
                  <p.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-2.5 text-[13px] font-bold leading-snug text-white">{p.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <TradeMock openJournal={openJournal} />
      </div>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────────────────── */

const STEPS = [
  { n: '01', icon: Newspaper, title: 'Scan', desc: 'Every 15 minutes: bars for 50 NIFTY stocks, the news wire triaged by Claude Haiku 5.5, and the NSE event calendar.' },
  { n: '02', icon: BrainCircuit, title: 'Reason', desc: 'A LangGraph loop tags the regime and Claude Sonnet 5.5 picks Trend-EMA, RSI-2, a breakout, or sitting out.' },
  { n: '03', icon: FlaskConical, title: 'Check', desc: 'The backtest gate, then sizing from 1% risk and six hard checks. The risk engine approves, resizes or vetoes.' },
  { n: '04', icon: Lock, title: 'Act & journal', desc: 'A bracket order goes to the paper broker with stop and target; a journal entry explains the trade in plain words.' },
];

const STATS = [
  { to: 50, suffix: '', label: 'NIFTY 50 stocks scanned every loop' },
  { to: 25, suffix: ' loops', label: 'a trading day, one every 15 minutes from 09:15' },
  { to: 6, suffix: ' checks', label: 'hard rules before every order reaches the broker' },
  { to: 0, suffix: '', label: 'LLM calls inside the risk engine' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#16181d]">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-0 h-[420px] w-[620px] rounded-full bg-volt/[0.08] blur-[120px]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="max-w-3xl">
          <motion.p initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-xs font-bold tracking-[0.3em]">
            <ShinyText text="HOW IT WORKS" className="font-bold text-volt/85" speed={4} />
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.06 }} className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            From a market tick to a journaled paper trade, in four steps.
          </motion.h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.07 }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition duration-300 hover:border-volt/35 hover:bg-white/[0.05]"
            >
              <p className="pointer-events-none absolute -right-1 -top-3 select-none text-[64px] font-black leading-none text-white/[0.05] transition group-hover:text-volt/10">{s.n}</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-volt/25 bg-volt/10 text-volt">
                  <s.icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="text-base font-bold text-white">{s.title}</h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="mt-10 grid grid-cols-2 gap-y-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-8 lg:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
                <CountUp to={s.to} suffix={s.suffix} duration={2} />
              </p>
              <p className="mx-auto mt-2 max-w-[200px] text-xs leading-relaxed text-zinc-500">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────── */

const VIEWS = [
  ['Live dashboard', 'dashboard'],
  ['Agent activity', 'activity'],
  ['Trade journal', 'journal'],
  ['Backtest report', 'backtest'],
  ['Risk & guardrails', 'risk'],
  ['Architecture', 'architecture'],
];

function SiteFooter({ go }) {
  return (
    <footer id="contact" className="relative overflow-hidden bg-[#111214]">
      <div className="mx-auto max-w-7xl px-5 pt-16 sm:px-8 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
              Rules,
              <br />
              not hunches
              <span className="text-volt">.</span>
            </h2>
            <button
              type="button"
              onClick={() => go('dashboard')}
              className="group mt-8 inline-flex items-center gap-3 rounded-2xl bg-[#1b1d22] py-2.5 pl-5 pr-2.5 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-[#22252b]"
            >
              Open the console
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-volt text-[#101502] transition group-hover:bg-volt-soft">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }} className="grid grid-cols-2 gap-x-6 gap-y-10">
            <div>
              <p className="text-sm font-bold text-white">Runs in</p>
              <p className="mt-3 text-sm text-zinc-400">Your browser</p>
              <p className="text-sm text-zinc-400">Paper account NX-PAPER-01 · ₹10,00,000</p>
              <p className="mt-6 text-sm font-bold text-white">Team</p>
              <p className="mt-3 text-sm text-zinc-400">Circuit Breakers</p>
              <p className="text-sm text-zinc-400">AgentX Hackathon 2026 · PS-02</p>
              <a href={REPO} target="_blank" rel="noreferrer" className="group mt-4 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
                <Github className="h-4 w-4 text-volt transition group-hover:text-volt-soft" />
                shreyascoder2006/agent_X
              </a>
            </div>
            <div className="sm:text-right">
              <p className="text-sm font-bold text-white">Inside the console</p>
              <div className="mt-3 space-y-2">
                {VIEWS.map(([label, id]) => (
                  <button key={id} type="button" onClick={() => go(id)} className="block w-full text-sm text-zinc-400 transition hover:text-white sm:text-right">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
        <div className="mt-14 border-t border-white/10 py-6">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-zinc-500 sm:flex-row">
            <p>© Niyam 2026 · Team Circuit Breakers</p>
            <p className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 fill-volt text-volt" />
              Paper trading only · not investment advice · illustrative data
            </p>
            <p className="flex items-center gap-2">
              niyam <span className="font-signature text-2xl leading-none text-zinc-300">means rule</span>
            </p>
          </div>
        </div>
      </div>
      <div className="px-2 pb-2 sm:px-3 sm:pb-3">
        <div className="relative h-[240px] overflow-hidden rounded-[20px] bg-gradient-to-br from-[#9ade33] via-[#8fce2b] to-[#79b71f] sm:h-[360px] sm:rounded-[26px]">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.35),transparent_55%),radial-gradient(ellipse_at_20%_90%,rgba(0,0,0,0.35),transparent_60%)]" />
          <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-[22%] select-none whitespace-nowrap text-center font-black leading-[0.8] tracking-[-0.05em] text-[#101402]/55 [font-size:18vw]">
            NIYAM
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function Landing() {
  const navigate = useNavigate();
  const go = (id) => navigate(`/${id}`);
  const watchDemo = () => {
    useSim.getState().startDemo();
    navigate('/activity');
  };
  return (
    <div id="landing" className="scroll-smooth h-full overflow-y-auto overflow-x-hidden bg-coal font-landing text-[16px] leading-normal text-white">
      <Hero openConsole={() => go('dashboard')} watchDemo={watchDemo} />
      <Problem />
      <Pillars />
      <Explainable openJournal={() => go('journal')} />
      <HowItWorks />
      <SiteFooter go={go} />
    </div>
  );
}
