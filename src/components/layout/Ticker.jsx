import { useSim } from '../../store/useSim.js';
import { UNIVERSE } from '../../data/universe.js';
import { fmtP, pct } from '../../lib/format.js';
import { cx } from '../../lib/cx.js';

export function Ticker() {
  const universe = useSim((st) => st.sim.universe);
  const nifty = useSim((st) => st.sim.nifty);
  const items = [
    { sym: 'NIFTY 50', p: nifty.p, c: nifty.p / nifty.prev - 1 },
    ...UNIVERSE.map((u) => ({ sym: u.sym, p: universe[u.sym].p, c: universe[u.sym].p / u.prev - 1 })),
  ];
  const row = (k) =>
    items.map((it) => (
      <span key={`${k}${it.sym}`} className="mx-4 inline-flex items-center gap-1.5 font-mono text-[11px] tnum">
        <span className="text-zinc-500">{it.sym}</span>
        <span className="text-zinc-200">{fmtP(it.p)}</span>
        <span className={cx(it.c >= 0 ? 'text-acid' : 'text-rose-400')}>{pct(it.c)}</span>
      </span>
    ));
  return (
    <div className="relative h-8 overflow-hidden border-b border-line bg-panel/70" aria-label="NIFTY 50 prices">
      <div className="absolute inset-y-0 left-0 flex animate-marquee items-center whitespace-nowrap will-change-transform hover:[animation-play-state:paused]">
        {row('a')}
        {row('b')}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
