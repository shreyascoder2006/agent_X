import { useSim } from '../../store/useSim.js';
import { useUI } from '../../store/useUI.js';
import { useNow } from '../../hooks/useNow.js';
import { Dot, Ic } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { hms } from '../../lib/format.js';
import { MOD } from './TopBar.jsx';

// Interval between the last two engine ticks (the feed is 5 Hz, so ~0.2 s).
let lastTick = performance.now();
let gap = 0.2;
useSim.subscribe(() => {
  const now = performance.now();
  gap = (now - lastTick) / 1000;
  lastTick = now;
});

function Seg({ children, className, title }) {
  return (
    <span title={title} className={cx('flex h-full items-center gap-1.5 border-r border-hair px-3 last:border-r-0', className)}>
      {children}
    </span>
  );
}

/** IDE-style status bar: connection, tick age, model latency, risk engine, clock. */
export function StatusBar() {
  const now = useNow(250);
  const t = useSim((st) => st.sim.t);
  const halted = useSim((st) => st.sim.halted);
  const mode = useSim((st) => st.sim.mode);
  const paused = useSim((st) => !!st.sim.demo?.paused);
  const sonnet = useSim((st) => st.sim.models.sonnet.calls);
  const setPalette = useUI((s) => s.setPalette);
  const ws = Math.round(34 + 6 * Math.sin(now / 2300) + 3 * Math.sin(now / 710));
  const age = Math.max(gap, (performance.now() - lastTick) / 1000);

  return (
    <footer className="relative z-30 flex h-7 shrink-0 items-stretch justify-between border-t border-hair bg-panel text-cap text-fg-3">
      <div className="flex min-w-0 items-stretch overflow-hidden">
        <Seg title="Paper exchange websocket">
          <Dot tone="green" />
          <span className="text-fg-2">NiyamEx paper</span>
          <span className="num">ws {ws} ms</span>
        </Seg>
        <Seg className="hidden sm:flex" title="Time since the last market tick">
          <Ic n="Activity" size={12} />
          <span className="num">{paused ? 'feed paused' : `last tick ${age.toFixed(1)} s`}</span>
        </Seg>
        <Seg className="hidden md:flex" title="Planner model latency">
          <Dot tone="indigo" />
          <span className="text-fg-2">Sonnet 5.5</span>
          <span className="num">p50 1.2 s · {sonnet} calls</span>
        </Seg>
        <Seg className={cx(halted && 'bg-risk/10 text-risk-text')}>
          <Ic n={halted ? 'Lock' : 'ShieldCheck'} size={12} className={halted ? '' : 'text-broker-text'} />
          <span className={halted ? 'font-medium' : 'text-fg-2'}>{halted ? 'Trading halted · re-arm required' : 'Risk engine armed'}</span>
        </Seg>
      </div>
      <div className="flex shrink-0 items-stretch">
        <Seg className="hidden lg:flex">
          <span className="rounded border border-warn/30 px-1.5 text-warn-text">illustrative data</span>
        </Seg>
        <Seg className="hidden md:flex">
          <button type="button" onClick={() => setPalette(true)} className="flex items-center gap-1 hover:text-fg">
            <Ic n="Command" size={12} /> {MOD} K
          </button>
        </Seg>
        <Seg>
          <span className="text-fg-2">{mode === 'demo' ? 'Replay' : 'Live'}</span>
          <span className="num text-fg">{hms(t)} IST</span>
        </Seg>
        <Seg className="hidden xl:flex">
          <span className="num">v0.9.0</span>
        </Seg>
      </div>
    </footer>
  );
}
