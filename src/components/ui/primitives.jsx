// Small building blocks shared by every view. See DESIGN.md for the tokens they use.
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ICONS } from './icons.js';
import { cx } from '../../lib/cx.js';
import { inr } from '../../lib/format.js';

export function Ic({ n, size = 16, className, sw = 1.75 }) {
  const C = ICONS[n] || ICONS.Circle;
  return <C size={size} strokeWidth={sw} className={className} aria-hidden="true" />;
}

/* ── Colour vocabulary ──────────────────────────────────────────────── */

export const TONE = {
  neutral: 'bg-white/[0.04] text-fg-2 ring-white/[0.08]',
  zinc: 'bg-white/[0.04] text-fg-2 ring-white/[0.08]',
  lime: 'bg-lime/[0.08] text-lime ring-lime/20',
  acid: 'bg-lime/[0.08] text-lime ring-lime/20',
  rose: 'bg-risk/10 text-risk-text ring-risk/25',
  amber: 'bg-warn/10 text-warn-text ring-warn/25',
  indigo: 'bg-agent/[0.12] text-[#A5B4FC] ring-agent/30',
  green: 'bg-broker/[0.12] text-[#4ADE80] ring-broker/30',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-400/25',
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-400/25',
  teal: 'bg-teal-500/10 text-teal-300 ring-teal-400/25',
};
export const DOT = {
  neutral: 'bg-fg-3',
  zinc: 'bg-fg-3',
  lime: 'bg-lime',
  acid: 'bg-lime',
  rose: 'bg-risk',
  amber: 'bg-warn',
  indigo: 'bg-agent-text',
  green: 'bg-broker-text',
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  teal: 'bg-teal-400',
};
export const TEXT = {
  lime: 'text-lime',
  acid: 'text-lime',
  rose: 'text-risk-text',
  amber: 'text-warn-text',
  indigo: 'text-agent-text',
  green: 'text-broker-text',
  zinc: 'text-fg-2',
  neutral: 'text-fg-2',
};
export const HEX = {
  lime: '#C6FF00',
  rose: '#F43F5E',
  roseText: '#FB7185',
  indigo: '#6366F1',
  indigoText: '#818CF8',
  green: '#16A34A',
  greenText: '#22C55E',
  amber: '#F59E0B',
  fg: '#ECEEF1',
  fg2: '#A3A9B3',
  fg3: '#80868F',
  mute: '#6C727C',
  panel: '#0D0F12',
  raised: '#12151A',
  overlay: '#181C22',
};

/** Up/down text colour for a signed number. */
export const signTone = (v) => (v > 0 ? 'text-lime' : v < 0 ? 'text-risk-text' : 'text-fg-2');

/** Green → amber → rose as a limit fills. */
export function limitColor(u) {
  if (u < 0.5) return '#22C55E';
  if (u < 0.75) return '#F59E0B';
  return '#F43F5E';
}

/* ── Readiness (skeletons on first load and route change) ───────────── */

export const ReadyContext = createContext(true);
export const useReady = () => useContext(ReadyContext);

export function Skel({ className, style }) {
  return <span aria-hidden="true" className={cx('skel block', className)} style={style} />;
}

function SkeletonBody() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col gap-3 px-5 pb-5 pt-1">
      <Skel className="h-4 w-1/3" />
      <Skel className="h-3 w-2/3" />
      <Skel className="min-h-[24px] flex-1" />
      <div className="flex gap-2">
        <Skel className="h-3 w-1/4" />
        <Skel className="h-3 w-1/5" />
      </div>
    </div>
  );
}

/* ── Panel ──────────────────────────────────────────────────────────── */

export const panelMotion = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 36, mass: 0.7 } },
};
export const pageMotion = { hidden: {}, show: { transition: { staggerChildren: 0.035 } } };

/**
 * The one surface. `hero` sits an elevation higher; `tone="risk"` lights the edge rose.
 * Title is sentence case; meta is a quiet caption; actions sit right.
 */
export function Panel({ id, title, meta, actions, children, className, body = 'px-5 pb-5', hero, tone, flush, headerClass, as = 'section' }) {
  const ready = useReady();
  const M = as === 'article' ? motion.article : as === 'div' ? motion.div : motion.section;
  return (
    <M
      id={id}
      variants={panelMotion}
      className={cx(
        'relative flex min-w-0 flex-col rounded-xl border transition-[border-color,box-shadow] duration-300',
        hero ? 'border-line bg-raised shadow-hero' : 'border-hair bg-panel shadow-panel',
        tone === 'risk' && '!border-risk/40 !shadow-risk',
        className,
      )}
    >
      {(title || actions) && (
        <header className={cx('flex items-start justify-between gap-3 px-5 pb-3 pt-4', headerClass)}>
          <div className="min-w-0">
            {title && <h2 className="truncate text-h2 text-fg">{title}</h2>}
            {meta && <p className="mt-0.5 truncate text-cap text-fg-3">{meta}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx('relative flex min-h-0 flex-1 flex-col', !flush && body)}>
        <div className={cx('flex min-h-0 flex-1 flex-col transition-opacity duration-300', !ready && 'opacity-0')}>{children}</div>
        {!ready && <SkeletonBody />}
      </div>
    </M>
  );
}

/** Legacy-compatible card: maps the old props onto Panel. */
export function Card({ title, sub, right, children, className, body = 'px-5 pb-5', tone, glow, id }) {
  return (
    <Panel id={id} title={title} meta={sub} actions={right} className={className} body={body} tone={tone === 'rose' ? 'risk' : undefined} hero={glow}>
      {children}
    </Panel>
  );
}

/* ── Chips, dots, keys ──────────────────────────────────────────────── */

export function Chip({ tone = 'neutral', icon, dot, pulse, mono, className, children, title }) {
  return (
    <span
      title={title}
      className={cx(
        'inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-cap font-medium ring-1 ring-inset',
        mono && 'num',
        TONE[tone],
        className,
      )}
    >
      {dot && <Dot tone={tone} pulse={pulse} />}
      {icon && <Ic n={icon} size={12} />}
      {children}
    </span>
  );
}
export const Pill = Chip;

export function Dot({ tone = 'lime', pulse, className, size = 6 }) {
  return (
    <span className={cx('relative inline-flex shrink-0', className)} style={{ width: size, height: size }}>
      {pulse && <span className={cx('absolute inset-0 animate-ping rounded-full opacity-60', DOT[tone])} />}
      <span className={cx('relative inline-flex h-full w-full rounded-full', DOT[tone])} />
    </span>
  );
}

export function Kbd({ children, className }) {
  return (
    <kbd className={cx('num inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-line bg-white/[0.03] px-1 text-tick text-fg-3', className)}>
      {children}
    </kbd>
  );
}

/** Ticker monogram: no company logos, just a calm lettermark. */
export function Monogram({ sym, size = 28, className, tone }) {
  const s = sym === '—' ? '··' : sym.replace(/[^A-Z]/g, '').slice(0, sym.length > 5 ? 2 : 3);
  return (
    <span
      className={cx(
        'num grid shrink-0 place-items-center rounded-md border font-semibold',
        tone === 'held' ? 'border-lime/25 bg-lime/[0.06] text-lime' : 'border-hair bg-overlay text-fg-2',
        className,
      )}
      style={{ width: size, height: size, fontSize: size <= 24 ? 9 : 10 }}
      aria-hidden="true"
    >
      {s}
    </span>
  );
}

/** Label · dotted leader · value. Used by receipts, ledgers and spec sheets. */
export function Ledger({ k, v, tone, mono = true, className, sub }) {
  return (
    <div className={cx('flex items-baseline gap-2 text-body', className)}>
      <span className="shrink-0 text-fg-3">{k}</span>
      <span className="leader" />
      <span className={cx('shrink-0 text-right', mono && 'num', tone || 'text-fg')}>
        {v}
        {sub && <span className="ml-1.5 text-fg-3">{sub}</span>}
      </span>
    </div>
  );
}

export function Empty({ icon = 'CircleDot', title, children, className }) {
  return (
    <div className={cx('grid flex-1 place-items-center rounded-lg border border-dashed border-line px-4 py-6 text-center', className)}>
      <div>
        <span className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full border border-hair bg-white/[0.02] text-fg-mute">
          <Ic n={icon} size={16} />
        </span>
        <p className="text-body font-medium text-fg-2">{title}</p>
        {children && <p className="mx-auto mt-1 max-w-xs text-cap text-fg-3">{children}</p>}
      </div>
    </div>
  );
}

/* ── Numbers ────────────────────────────────────────────────────────── */

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function Digit({ d }) {
  return (
    <span className="relative inline-block overflow-hidden" aria-hidden="true">
      <span className="invisible">0</span>
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[420ms] ease-[cubic-bezier(.2,.7,.2,1)]"
        style={{ transform: `translateY(${-d * 10}%)` }}
      >
        {DIGITS.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  );
}

/** Holds a fast-changing value for `ms` so rolled digits settle between ticks. */
function useThrottled(value, ms) {
  const [v, setV] = useState(value);
  const last = useRef(0);
  const pending = useRef(null);
  useEffect(() => {
    const now = performance.now();
    const wait = ms - (now - last.current);
    if (wait <= 0) {
      last.current = now;
      setV(value);
      return undefined;
    }
    clearTimeout(pending.current);
    pending.current = setTimeout(() => {
      last.current = performance.now();
      setV(value);
    }, wait);
    return () => clearTimeout(pending.current);
  }, [value, ms]);
  return v;
}

/** A number that rolls digit by digit. `text` is the already-formatted string. */
export function Rolling({ text: raw, className, hold = 900 }) {
  const text = useThrottled(raw, hold);
  const chars = String(text).split('');
  const n = chars.length;
  return (
    <span className={cx('num inline-flex whitespace-nowrap', className)}>
      <span className="sr-only">{text}</span>
      {chars.map((ch, i) =>
        ch >= '0' && ch <= '9' ? (
          <Digit key={`d${n - i}`} d={Number(ch)} />
        ) : (
          <span key={`s${n - i}${ch}`} aria-hidden="true">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

/** Rupee figure that rolls digit by digit. */
export function Money({ v, dp = 2, sign = false, className }) {
  return <Rolling text={inr(v, dp, sign)} className={className} />;
}

/** Price tick: an 8% background tint for 400 ms, never a solid block. */
export function Tick({ v, children, className }) {
  const prev = useRef(v);
  const [state, setState] = useState({ k: 0, dir: 0 });
  useEffect(() => {
    const p = prev.current;
    prev.current = v;
    if (typeof v === 'number' && typeof p === 'number' && v !== p) setState((s) => ({ k: s.k + 1, dir: v > p ? 1 : -1 }));
  }, [v]);
  return (
    <span key={state.k} className={cx('-mx-1 rounded px-1', state.k > 0 && (state.dir > 0 ? 'animate-tickup' : 'animate-tickdown'), className)}>
      {children}
    </span>
  );
}
export const Flash = ({ v, children, className }) => (
  <Tick v={v} className={className}>
    {children}
  </Tick>
);

/* ── Small charts ───────────────────────────────────────────────────── */

export function Spark({ data, height = 28, color = '#C6FF00', baseline, fill = true, className, width = 120, strokeWidth = 1.25 }) {
  const id = useId().replace(/:/g, '');
  const w = width;
  const h = height;
  if (!data || data.length < 2) return <svg className={cx('block w-full', className)} height={h} aria-hidden="true" />;
  let mn = Math.min(...data);
  let mx = Math.max(...data);
  if (baseline != null) {
    mn = Math.min(mn, baseline);
    mx = Math.max(mx, baseline);
  }
  if (mx - mn < 1e-9) {
    mx += 1;
    mn -= 1;
  }
  const X = (i) => (i / (data.length - 1)) * w;
  const Y = (v) => h - 2 - ((v - mn) / (mx - mn)) * (h - 4);
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const lx = X(data.length - 1);
  const ly = Y(data[data.length - 1]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cx('block w-full overflow-visible', className)} height={h} aria-hidden="true">
      <defs>
        <linearGradient id={`sp${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.09" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#sp${id})`} />}
      {baseline != null && (
        <line x1="0" x2={w} y1={Y(baseline)} y2={Y(baseline)} stroke="rgba(255,255,255,0.14)" strokeDasharray="2 3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      )}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="1.6" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Ring({ value, size = 44, stroke = 3, color = '#ECEEF1', track = 'rgba(255,255,255,0.07)', children, className }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={cx('relative grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .6s ease, stroke .3s' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Bar({ value, color = '#ECEEF1', className, track = 'bg-white/[0.06]', marker }) {
  return (
    <div className={cx('relative h-1 rounded-full', track, className)}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
      {marker != null && <span className="absolute -top-1 h-3 w-px bg-fg-2" style={{ left: `${marker * 100}%` }} />}
    </div>
  );
}

/* ── Controls ───────────────────────────────────────────────────────── */

/** Segmented control; the selected thumb glides between options. */
export function Segmented({ options, value, onChange, label, size = 'md', className }) {
  const gid = useId();
  return (
    <div role="tablist" aria-label={label} className={cx('relative inline-flex rounded-lg border border-hair bg-bg/60 p-0.5', className)}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={cx(
              'relative rounded-md font-medium transition-colors duration-200',
              size === 'sm' ? 'px-2 py-0.5 text-cap' : 'px-2.5 py-1 text-cap',
              on ? 'text-fg' : 'text-fg-3 hover:text-fg-2',
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg${gid}`}
                className="absolute inset-0 rounded-md border border-line bg-overlay shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {o.icon && <Ic n={o.icon} size={13} />}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Underlined tabs for chart and panel headers. */
export function Tabs({ options, value, onChange, label, className }) {
  const gid = useId();
  return (
    <div role="tablist" aria-label={label} className={cx('flex items-center gap-1', className)}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={cx('relative flex h-8 items-center gap-1.5 rounded-md px-2.5 text-body font-medium transition-colors', on ? 'text-fg' : 'text-fg-3 hover:text-fg-2')}
          >
            {o.node}
            {on && (
              <motion.span layoutId={`tab${gid}`} className="absolute inset-x-2 -bottom-px h-px bg-fg" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer select-none items-center gap-2 text-cap text-fg-2">
      <span className="relative inline-flex">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-4 w-7 rounded-full bg-white/[0.12] transition peer-checked:bg-fg-2 peer-focus-visible:ring-2 peer-focus-visible:ring-lime/60" />
        <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-fg-2 transition peer-checked:translate-x-3 peer-checked:bg-bg" />
      </span>
      {label}
    </label>
  );
}

export const btn = {
  base: 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 disabled:cursor-not-allowed disabled:opacity-40',
  ghost: 'border border-hair bg-white/[0.02] text-fg-2 hover:border-line hover:bg-white/[0.04] hover:text-fg',
  primary: 'bg-lime text-bg hover:brightness-110 active:scale-[.98]',
  risk: 'border border-risk/40 bg-risk/10 text-risk-text hover:bg-risk/[0.16]',
  sm: 'h-7 px-2.5 text-cap',
  md: 'h-8 px-3 text-body',
};

/** Types text in from `born` (ms timestamp); old items render complete. */
export function TypeOut({ text, born = 0, cps = 85 }) {
  const total = text.length;
  const calc = () => Math.min(total, Math.max(0, Math.floor(((Date.now() - born) / 1000) * cps)));
  const [n, setN] = useState(calc);
  useEffect(() => {
    if (calc() >= total) {
      setN(total);
      return undefined;
    }
    let raf = 0;
    const loop = () => {
      const k = calc();
      setN(k);
      if (k < total) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [born, total]);
  const done = n >= total;
  return (
    <>
      {done ? text : text.slice(0, n)}
      {!done && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-blink bg-agent-text" />}
    </>
  );
}

/** Hover tooltip. */
export function Tip({ text, children, className, align = 'center' }) {
  return (
    <span className={cx('group/tip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cx(
          'pointer-events-none absolute bottom-full z-40 mb-2 w-max max-w-[260px] translate-y-1 rounded-lg border border-line bg-overlay px-2.5 py-1.5 text-left text-cap font-normal normal-case tracking-normal text-fg-2 opacity-0 shadow-pop transition duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100',
          align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2',
        )}
      >
        {text}
      </span>
    </span>
  );
}

export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lg-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E232A" />
          <stop offset="1" stopColor="#12151A" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="url(#lg-tile)" stroke="rgba(255,255,255,0.10)" />
      <path d="M10 22V10l12 12V10" fill="none" stroke="#ECEEF1" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="10" r="2.2" fill="#C6FF00" />
    </svg>
  );
}

export function Spinner({ className, tone = 'amber' }) {
  return (
    <span
      className={cx(
        'inline-block h-3 w-3 animate-spin rounded-full border-2',
        tone === 'indigo' ? 'border-agent/25 border-t-agent-text' : 'border-warn/25 border-t-warn',
        className,
      )}
    />
  );
}

export function Label({ children, className }) {
  return <p className={cx('text-cap font-medium text-fg-3', className)}>{children}</p>;
}

/** Legacy wrapper; the tilt effect is gone, the box stays. */
export function Tilt({ children, className }) {
  return <div className={className}>{children}</div>;
}

/** Wraps a chart so it draws in once on mount (left-to-right reveal). */
export function DrawIn({ children, className, style }) {
  const ready = useReady();
  return (
    <div className={cx(ready && 'draw-in', className)} style={style}>
      {children}
    </div>
  );
}
