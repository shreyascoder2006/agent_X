import { useSim, useDerived } from '../../store/useSim.js';
import { useUI } from '../../store/useUI.js';
import { UNIVERSE } from '../../data/universe.js';
import { fmtP, num, pct } from '../../lib/format.js';
import { cx } from '../../lib/cx.js';

function Cell({ k, v, c, className }) {
  return (
    <span className={cx('flex shrink-0 items-center gap-1.5 border-r border-hair px-3 text-cap', className)}>
      <span className="text-fg-3">{k}</span>
      <span className="num text-fg">{v}</span>
      {c != null && <span className={cx('num', c >= 0 ? 'text-lime' : 'text-risk-text')}>{pct(c)}</span>}
    </span>
  );
}

/** Index strip: NIFTY, India VIX, breadth and regime, then a calm tape of the 50 names. */
export function Ticker() {
  const universe = useSim((st) => st.sim.universe);
  const nifty = useSim((st) => st.sim.nifty);
  const regime = useSim((st) => st.sim.regime);
  const openDrawer = useUI((s) => s.openDrawer);
  const d = useDerived();
  const row = (k) =>
    UNIVERSE.map((u) => {
      const p = universe[u.sym].p;
      const c = p / u.prev - 1;
      return (
        <button
          type="button"
          tabIndex={k === 'a' ? 0 : -1}
          key={`${k}${u.sym}`}
          onClick={() => openDrawer(u.sym)}
          className="mx-3 inline-flex items-center gap-1.5 text-cap transition-colors hover:text-fg"
        >
          <span className="text-fg-3">{u.sym}</span>
          <span className="num text-fg-2">{fmtP(p)}</span>
          <span className={cx('num', c >= 0 ? 'text-lime/80' : 'text-risk-text/90')}>{pct(c)}</span>
        </button>
      );
    });
  return (
    <div className="relative z-20 flex h-7 items-stretch overflow-hidden border-b border-hair bg-panel/70" aria-label="Market strip">
      <Cell k="NIFTY 50" v={num(nifty.p, 2)} c={nifty.p / nifty.prev - 1} className="pl-4 md:pl-6" />
      <Cell k="India VIX" v={regime.vix.toFixed(2)} className="hidden sm:flex" />
      <Cell k="A/D" v={`${d.adv}/${d.dec}`} className="hidden lg:flex" />
      <Cell k="Regime" v={regime.label} className="hidden lg:flex" />
      <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_48px,#000_calc(100%-48px),transparent)]">
        <div className="absolute inset-y-0 left-0 flex animate-marquee items-center whitespace-nowrap will-change-transform hover:[animation-play-state:paused]">
          {row('a')}
          {row('b')}
        </div>
      </div>
    </div>
  );
}
