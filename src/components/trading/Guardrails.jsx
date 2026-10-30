import { useId } from 'react';
import { useSim } from '../../store/useSim.js';
import { KILL_CUE } from '../../sim/index.js';
import { Ic, limitColor } from '../ui/primitives.jsx';
import { Rearm } from '../layout/HaltBanner.jsx';
import { useTween } from '../../hooks/useTween.js';
import { cx } from '../../lib/cx.js';
import { hms, inr, plural } from '../../lib/format.js';

/** Semicircle gauge for the −2% daily loss limit. Fills green → amber → rose. */
export function Gauge({ used, size = 280 }) {
  const gid = useId().replace(/:/g, '');
  const u = useTween(Math.min(1.05, Math.max(0, used)), 650);
  const w = size;
  const h = Math.round(size * 0.6);
  const cx0 = w / 2;
  const cy0 = h - 14;
  const r = w / 2 - 26;
  const A = (f) => Math.PI + Math.PI * f;
  const pt = (a, rr = r) => [cx0 + rr * Math.cos(a), cy0 + rr * Math.sin(a)];
  const arc = (f0, f1, rr = r) => {
    const [x0, y0] = pt(A(f0), rr);
    const [x1, y1] = pt(A(f1), rr);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${rr} ${rr} 0 ${f1 - f0 > 1 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const f = Math.min(1, u);
  const col = limitColor(u);
  const [ex, ey] = pt(A(f));
  const ticks = [
    { f: 0, t: '0' },
    { f: 0.5, t: '50%' },
    { f: 0.75, t: '75%' },
    { f: 1, t: '−2%' },
  ];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto block w-full max-w-[340px]" role="img" aria-label={`Daily loss limit ${Math.round(used * 100)}% used`}>
      <defs>
        <filter id={`gl${gid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <path d={arc(0, 0.5, r + 14)} stroke="#22C55E" strokeOpacity="0.35" strokeWidth="3" fill="none" />
      <path d={arc(0.5, 0.75, r + 14)} stroke="#F59E0B" strokeOpacity="0.45" strokeWidth="3" fill="none" />
      <path d={arc(0.75, 1, r + 14)} stroke="#F43F5E" strokeOpacity="0.55" strokeWidth="3" fill="none" />
      <path d={arc(0, 1)} stroke="#24242a" strokeWidth="16" strokeLinecap="round" fill="none" />
      {f > 0.004 && (
        <>
          <path d={arc(0, f)} stroke={col} strokeWidth="16" strokeLinecap="round" fill="none" filter={`url(#gl${gid})`} opacity="0.55" />
          <path d={arc(0, f)} stroke={col} strokeWidth="16" strokeLinecap="round" fill="none" />
        </>
      )}
      <circle cx={ex} cy={ey} r="7" fill="#09090B" stroke={f > 0.004 ? col : '#3f3f46'} strokeWidth="3" />
      {ticks.map((t) => {
        const [x, y] = pt(A(t.f), r + 26);
        return (
          <text key={t.t} x={x} y={y + 4} textAnchor={t.f === 0 ? 'start' : t.f === 1 ? 'end' : 'middle'} fontSize="10" fill="#71717a" fontFamily="Geist Mono, monospace">
            {t.t}
          </text>
        );
      })}
    </svg>
  );
}

export function LossGauge({ d, size = 280 }) {
  const col = limitColor(d.used);
  return (
    <div className="relative">
      <Gauge used={d.used} size={size} />
      <div className="absolute inset-x-0 bottom-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Daily loss used</p>
        <p className="font-mono text-3xl font-semibold leading-tight tnum" style={{ color: col }}>
          {Math.round(d.used * 100)}%
        </p>
        <p className="text-xs text-zinc-400">
          {d.dayPnl >= 0 ? (
            <>
              day <span className="font-mono text-acid tnum">{inr(d.dayPnl, 0, true)}</span> · headroom <span className="font-mono tnum">{inr(d.headroom)}</span>
            </>
          ) : (
            <>
              <span className="font-mono tnum">{inr(-d.dayPnl)}</span> of ₹20,000 · headroom <span className="font-mono tnum">{inr(Math.max(0, d.headroom))}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** The human kill switch: one press cancels, flattens and locks. Re-arming takes two steps. */
export function KillSwitch({ showRearm = true, where = 'card' }) {
  const sim = useSim((st) => st.sim);
  const kill = useSim((st) => st.kill);
  const rearmStart = useSim((st) => st.rearmStart);
  const cue = !!(sim.demo && sim.demo.killCue && !sim.halted);
  const h = sim.halt;
  return (
    <div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={sim.halted ? rearmStart : kill}
          aria-pressed={sim.halted}
          aria-label={sim.halted ? 'Trading halted. Start the re-arm' : 'Kill switch: cancel orders, flatten positions, lock trading'}
          className={cx(
            'group relative grid h-[88px] w-[88px] shrink-0 place-items-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 active:scale-95',
            sim.halted
              ? 'bg-rose-500 text-white shadow-glowrose'
              : 'bg-gradient-to-b from-rose-500/25 to-rose-700/10 text-rose-300 ring-2 ring-rose-500/60 hover:from-rose-500/35 hover:text-rose-100 hover:shadow-glowrose',
          )}
        >
          {cue && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />
              <span className="absolute -inset-2.5 animate-pulse rounded-full ring-2 ring-rose-400/80" />
            </>
          )}
          <span className={cx('absolute inset-[7px] rounded-full border border-dashed', sim.halted ? 'border-white/40' : 'border-rose-400/40 group-hover:animate-spinslow')} />
          <Ic n={sim.halted ? 'Lock' : 'Power'} size={30} sw={2.4} />
        </button>
        <div className="min-w-0">
          <p className={cx('text-sm font-semibold uppercase tracking-[0.16em]', sim.halted ? 'text-rose-300' : 'text-zinc-100')}>
            {sim.halted ? 'Halted' : 'Kill switch'}
          </p>
          <p className="text-xs text-zinc-400">
            {sim.halted ? `${plural(h.cancelled, 'order')} cancelled · ${h.flattened} flat in ${h.flatMs} s` : 'cancel · flatten · lock'}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            {sim.halted ? `Locked at ${hms(h.at)} IST · re-arm takes 2 steps` : 'One press halts the risk engine and the broker.'}
          </p>
          {cue && (
            <p className="mt-1.5 text-xs font-semibold text-rose-300">
              Press now · auto-press in {Math.max(0, Math.ceil(KILL_CUE[1] - sim.demo.t))} s
            </p>
          )}
        </div>
      </div>
      {showRearm && sim.halted && <Rearm where={where} className="mt-3" />}
    </div>
  );
}
