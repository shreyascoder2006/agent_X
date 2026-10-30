// Small building blocks shared by every view.
import { useEffect, useId, useRef, useState } from 'react';
import { ICONS } from './icons.js';
import { cx } from '../../lib/cx.js';
import { useTween } from '../../hooks/useTween.js';
import { inr } from '../../lib/format.js';

export function Ic({ n, size = 16, className, sw = 1.75 }) {
  const C = ICONS[n] || ICONS.Circle;
  return <C size={size} strokeWidth={sw} className={className} aria-hidden="true" />;
}

export const TONE = {
  acid: 'bg-acid/10 text-acid ring-acid/25',
  rose: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/30',
  green: 'bg-green-600/15 text-green-300 ring-green-500/30',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-400/30',
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-400/30',
  teal: 'bg-teal-500/10 text-teal-300 ring-teal-400/30',
  zinc: 'bg-white/[0.04] text-zinc-300 ring-white/10',
};
export const DOT = {
  acid: 'bg-acid',
  rose: 'bg-rose-400',
  amber: 'bg-amber-400',
  indigo: 'bg-indigo-400',
  green: 'bg-green-400',
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  teal: 'bg-teal-400',
  zinc: 'bg-zinc-400',
};
export const TEXT = {
  acid: 'text-acid',
  rose: 'text-rose-400',
  amber: 'text-amber-300',
  indigo: 'text-indigo-300',
  green: 'text-green-400',
  zinc: 'text-zinc-300',
};

export function Pill({ tone = 'zinc', icon, dot, pulse, mono, className, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        mono && 'font-mono',
        TONE[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={cx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', DOT[tone])} />}
          <span className={cx('relative inline-flex h-1.5 w-1.5 rounded-full', DOT[tone])} />
        </span>
      )}
      {icon && <Ic n={icon} size={11} />}
      {children}
    </span>
  );
}

export function Card({ title, icon, sub, right, children, className, body = 'px-4 pb-4', tone, glow, id }) {
  return (
    <section
      id={id}
      className={cx(
        'relative min-w-0 rounded-xl border bg-card/90 transition-colors duration-300',
        tone === 'rose' ? 'border-rose-500/40 shadow-glowrose' : glow ? 'border-acid/30 shadow-glow' : 'border-line',
        className,
      )}
    >
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 px-4 pb-2.5 pt-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && (
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/[0.04] text-zinc-400 ring-1 ring-white/[0.06]">
                <Ic n={icon} size={13} />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{title}</h3>
              {sub && <p className="truncate text-[11px] text-zinc-500">{sub}</p>}
            </div>
          </div>
          {right && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{right}</div>}
        </header>
      )}
      <div className={body}>{children}</div>
    </section>
  );
}

/** Briefly flashes lime (up) or rose (down) when `v` changes. */
export function Flash({ v, children, className, soft }) {
  const prev = useRef(v);
  const [state, setState] = useState({ k: 0, dir: 0 });
  useEffect(() => {
    const p = prev.current;
    prev.current = v;
    if (typeof v === 'number' && typeof p === 'number' && v !== p) setState((s) => ({ k: s.k + 1, dir: v > p ? 1 : -1 }));
  }, [v]);
  return (
    <span
      key={state.k}
      className={cx(
        '-mx-1 rounded px-1',
        state.k > 0 && (soft ? (state.dir > 0 ? 'animate-glowup' : 'animate-glowdown') : state.dir > 0 ? 'animate-flashup' : 'animate-flashdown'),
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Rolling rupee figure with tabular digits. */
export function Money({ v, dp = 2, sign = false, className }) {
  const x = useTween(v, 420);
  return (
    <Flash soft v={Math.round(v * 100)} className={cx('font-mono tnum', className)}>
      {inr(x, dp, sign)}
    </Flash>
  );
}

export function Spark({ data, height = 36, color = '#C6FF00', baseline, fill = true, className }) {
  const id = useId().replace(/:/g, '');
  const w = 200;
  const h = height;
  if (!data || data.length < 2) return <svg className={className} height={h} />;
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
  const Y = (v) => h - 3 - ((v - mn) / (mx - mn)) * (h - 6);
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cx('block w-full overflow-visible', className)} height={h} aria-hidden="true">
      <defs>
        <linearGradient id={`sp${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#sp${id})`} />}
      {baseline != null && (
        <line x1="0" x2={w} y1={Y(baseline)} y2={Y(baseline)} stroke="#3f3f46" strokeDasharray="3 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function Ring({ value, size = 44, stroke = 4, color = '#C6FF00', track = '#24242a', children, className }) {
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

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Card wrapper with a subtle 3D tilt and a cursor-following glow. */
export function Tilt({ children, className, max = 4 }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el || reduceMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cx('tilt transition-transform duration-200 ease-out', className)}>
      {children}
    </div>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-lg border border-line bg-panel p-0.5">
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
              'rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/60',
              on ? 'bg-acid text-ink shadow-glowsm' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer select-none items-center gap-2 text-xs text-zinc-300">
      <span className="relative inline-flex">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-4 w-7 rounded-full bg-zinc-700 transition peer-checked:bg-acid peer-focus-visible:ring-2 peer-focus-visible:ring-acid/50" />
        <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-zinc-200 transition peer-checked:translate-x-3 peer-checked:bg-ink" />
      </span>
      {label}
    </label>
  );
}

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
      {!done && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-blink bg-acid" />}
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
          'pointer-events-none absolute bottom-full z-40 mb-2 w-max max-w-[260px] translate-y-1 rounded-lg border border-line2 bg-panel/95 px-2.5 py-1.5 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-zinc-300 opacity-0 shadow-xl backdrop-blur transition duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100',
          align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2',
        )}
      >
        {text}
      </span>
    </span>
  );
}

export function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#C6FF00" />
      <path d="M9.5 22.5V9.5l13 13V9.5" fill="none" stroke="#09090B" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22.5" cy="9.5" r="2.1" fill="#09090B" />
    </svg>
  );
}

export function Spinner({ className }) {
  return <span className={cx('inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-400/25 border-t-amber-400', className)} />;
}

export function Bar({ value, color = '#C6FF00', className, track = 'bg-white/[0.06]' }) {
  return (
    <div className={cx('h-1.5 overflow-hidden rounded-full', track, className)}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}

export function Label({ children, className }) {
  return <p className={cx('text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500', className)}>{children}</p>;
}

/** Green → amber → rose as a limit fills. */
export function limitColor(u) {
  if (u < 0.5) return '#22C55E';
  if (u < 0.75) return '#F59E0B';
  return '#F43F5E';
}
