// The daily-loss gauge (a thin precision arc with ticks and a needle) and the human kill switch.
import { useSim } from '../../store/useSim.js';
import { KILL_CUE } from '../../sim/index.js';
import { Ic, limitColor } from '../ui/primitives.jsx';
import { Rearm } from '../layout/HaltBanner.jsx';
import { useTween } from '../../hooks/useTween.js';
import { cx } from '../../lib/cx.js';
import { hms, inr, plural } from '../../lib/format.js';

const SWEEP = 240; // degrees, from lower-left through the top to lower-right
const A0 = 150;

/** Precision gauge for the −2% daily loss limit. */
export function Gauge({ used, size = 260, compact }) {
  const u = useTween(Math.min(1.04, Math.max(0, used)), 700);
  const f = Math.min(1, u);
  const W = size;
  const H = Math.round(size * (compact ? 0.78 : 0.84));
  const c = W / 2;
  const cy = W / 2 + 4;
  const r = W / 2 - 30;
  const ang = (x) => ((A0 + SWEEP * x) * Math.PI) / 180;
  const P = (x, rr = r) => [c + rr * Math.cos(ang(x)), cy + rr * Math.sin(ang(x))];
  const arc = (x0, x1, rr = r) => {
    const [ax, ay] = P(x0, rr);
    const [bx, by] = P(x1, rr);
    return `M${ax.toFixed(2)} ${ay.toFixed(2)} A${rr} ${rr} 0 ${(x1 - x0) * SWEEP > 180 ? 1 : 0} 1 ${bx.toFixed(2)} ${by.toFixed(2)}`;
  };
  const col = limitColor(u);
  const ticks = Array.from({ length: 41 }, (_, i) => i / 40);
  const majors = [
    [0, '0'],
    [0.25, '25'],
    [0.5, '50'],
    [0.75, '75'],
    [1, '−2%'],
  ];
  const [nx0, ny0] = P(f, r * 0.56);
  const [nx, ny] = P(f, r - 15);
  const [tx, ty] = P(f, r + 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" style={{ maxWidth: size }} role="img" aria-label={`Daily loss limit ${Math.round(used * 100)}% used`}>
      {/* zone band */}
      <path d={arc(0, 0.5, r + 8)} stroke="#22C55E" strokeOpacity="0.35" strokeWidth="2" fill="none" />
      <path d={arc(0.5, 0.75, r + 8)} stroke="#F59E0B" strokeOpacity="0.5" strokeWidth="2" fill="none" />
      <path d={arc(0.75, 1, r + 8)} stroke="#F43F5E" strokeOpacity="0.7" strokeWidth="2" fill="none" />
      {/* ticks */}
      {ticks.map((x) => {
        const major = Math.abs((x * 4) % 1) < 1e-6;
        const [ax, ay] = P(x, r - 2);
        const [bx, by] = P(x, r - (major ? 12 : 6));
        return <line key={x} x1={ax} y1={ay} x2={bx} y2={by} stroke={x <= f + 1e-6 && f > 0.004 ? col : 'rgba(255,255,255,0.18)'} strokeOpacity={major ? 0.95 : 0.6} strokeWidth={major ? 1.5 : 1} />;
      })}
      {majors.map(([x, t]) => {
        const [lx, ly] = P(x, r + 20);
        return (
          <text key={t} x={lx} y={ly + 4} textAnchor="middle" fontSize="11" fill="#80868F" fontFamily="Geist Mono, monospace">
            {t}
          </text>
        );
      })}
      {/* progress hairline */}
      <path d={arc(0, 1, r + 2)} stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {f > 0.004 && <path d={arc(0, f, r + 2)} stroke={col} strokeWidth="2" fill="none" strokeLinecap="round" />}
      {/* needle: a pointer segment, leaving the centre free for the readout */}
      <circle cx={c} cy={cy} r={r * 0.56} fill="none" stroke="rgba(255,255,255,0.05)" />
      <line x1={nx0} y1={ny0} x2={nx} y2={ny} stroke="#ECEEF1" strokeWidth="2" strokeLinecap="round" />
      <circle cx={tx} cy={ty} r="3" fill={f > 0.004 ? col : '#6C727C'} />
    </svg>
  );
}

export function LossGauge({ d, size = 260, compact }) {
  const col = limitColor(d.used);
  const pctUsed = Math.round(d.used * 100);
  return (
    <div>
      <div className="relative">
        <Gauge used={d.used} size={size} compact={compact} />
        <div className="pointer-events-none absolute inset-x-0 text-center" style={{ top: compact ? '44%' : '46%' }}>
          <p className="num text-[30px] font-semibold leading-8" style={{ color: d.used >= 0.5 ? col : '#ECEEF1' }}>
            {pctUsed}
            <span className="text-[18px] text-fg-3">%</span>
          </p>
          <p className="text-cap text-fg-3">of the ₹20,000 day limit</p>
        </div>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-3 border-t border-hair pt-3 text-cap">
        <div>
          <p className="text-fg-3">Day P&amp;L</p>
          <p className={cx('num text-body', d.dayPnl >= 0 ? 'text-lime' : 'text-risk-text')}>{inr(d.dayPnl, 0, true)}</p>
        </div>
        <div className="text-right">
          <p className="text-fg-3">Headroom</p>
          <p className="num text-body text-fg">{inr(Math.max(0, d.headroom))}</p>
        </div>
      </div>
    </div>
  );
}

/** The physical kill switch: recessed bezel, one press cancels, flattens and locks. */
export function KillButton({ size = 96 }) {
  const sim = useSim((st) => st.sim);
  const kill = useSim((st) => st.kill);
  const rearmStart = useSim((st) => st.rearmStart);
  const cue = !!(sim.demo && sim.demo.killCue && !sim.halted);
  const pressed = sim.halted;
  return (
    <button
      type="button"
      onClick={pressed ? rearmStart : kill}
      aria-pressed={pressed}
      aria-label={pressed ? 'Trading halted. Start the re-arm' : 'Kill switch: cancel orders, flatten positions, lock trading'}
      className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-risk/70 focus-visible:ring-offset-4 focus-visible:ring-offset-panel"
      style={{ width: size, height: size }}
    >
      {cue && <span className="absolute -inset-3 animate-ping rounded-full border-2 border-risk/60" />}
      {/* bezel */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #1d2128 0%, #0b0d10 72%)',
          boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.85), inset 0 -1px 0 rgba(255,255,255,0.07), 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      />
      {/* guard ring */}
      <span className={cx('absolute inset-[5px] rounded-full border transition-colors', pressed || cue ? 'border-risk/50' : 'border-white/[0.06] group-hover:border-risk/30')} />
      {/* cap */}
      <span
        className={cx('absolute inset-[11px] grid place-items-center rounded-full transition-all duration-150 ease-out group-active:translate-y-[4px]', pressed && 'translate-y-[4px]')}
        style={{
          background: pressed
            ? 'radial-gradient(circle at 50% 35%, #ff6b83 0%, #d12a49 55%, #8c1730 100%)'
            : 'radial-gradient(circle at 50% 28%, #d9445f 0%, #a8203b 58%, #6e1226 100%)',
          boxShadow: pressed
            ? '0 1px 0 #4a0d19, inset 0 3px 10px rgba(0,0,0,0.45), 0 0 36px rgba(244,63,94,0.55), 0 0 0 1px rgba(255,255,255,0.08)'
            : '0 5px 0 #4a0d19, 0 10px 18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.32), 0 0 0 1px rgba(0,0,0,0.4)',
        }}
      >
        <span className="flex flex-col items-center text-white/90" style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.45)' }}>
          <Ic n={pressed ? 'Lock' : 'Power'} size={size * 0.24} sw={2.4} />
          <span className="mt-0.5 text-[10px] font-bold tracking-[0.18em]">{pressed ? 'HALTED' : 'KILL'}</span>
        </span>
      </span>
    </button>
  );
}

/** Kill switch with its label, halt facts and the 2-step re-arm. */
export function KillSwitch({ showRearm = true, where = 'card', size = 96 }) {
  const sim = useSim((st) => st.sim);
  const cue = !!(sim.demo && sim.demo.killCue && !sim.halted);
  const h = sim.halt;
  return (
    <div>
      <div className="flex items-center gap-5">
        <KillButton size={size} />
        <div className="min-w-0">
          <p className={cx('text-h2', sim.halted ? 'text-risk-text' : 'text-fg')}>{sim.halted ? 'Trading halted' : 'Kill switch'}</p>
          <p className="text-body text-fg-2">
            {sim.halted ? `${plural(h.cancelled, 'order')} cancelled · ${plural(h.flattened, 'position')} flat in ${h.flatMs} s` : 'Cancel · flatten · lock'}
          </p>
          <p className="mt-1 text-cap text-fg-3">
            {sim.halted ? (
              <>
                Locked at <span className="num">{hms(h.at)}</span> IST · re-arm takes 2 steps
              </>
            ) : (
              'One press halts the risk engine and the broker.'
            )}
          </p>
          {cue && (
            <p className="mt-1.5 text-cap font-semibold text-risk-text">
              Press now · auto-press in <span className="num">{Math.max(0, Math.ceil(KILL_CUE[1] - sim.demo.t))} s</span>
            </p>
          )}
        </div>
      </div>
      {showRearm && sim.halted && <Rearm where={where} className="mt-4" />}
    </div>
  );
}
