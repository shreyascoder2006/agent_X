import { useSim } from '../../store/useSim.js';
import { Ic } from '../ui/primitives.jsx';
import { hms, inr, plural } from '../../lib/format.js';
import { useNow } from '../../hooks/useNow.js';
import { cx } from '../../lib/cx.js';

/** The 2-step re-arm control: confirm the review, then re-arm. Auto-cancels after 15 s. */
export function Rearm({ where = 'banner', className }) {
  const sim = useSim((st) => st.sim);
  const start = useSim((st) => st.rearmStart);
  const ack = useSim((st) => st.rearmAck);
  const confirm = useSim((st) => st.rearmConfirm);
  const cancel = useSim((st) => st.rearmCancel);
  const now = useNow(250, !!sim.rearm);
  if (!sim.halted) return null;
  if (!sim.rearm) {
    return (
      <button
        type="button"
        onClick={start}
        className={cx(
          'inline-flex items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20',
          className,
        )}
      >
        <Ic n="Unlock" size={15} /> Re-arm · step 1 of 2
      </button>
    );
  }
  const left = Math.max(0, Math.ceil((sim.rearm.until - now) / 1000));
  return (
    <div className={cx('flex flex-wrap items-center gap-2 rounded-xl border border-rose-400/40 bg-ink/70 px-3 py-2 animate-fadein', className)}>
      <label htmlFor={`rearm-ack-${where}`} className="flex cursor-pointer items-center gap-2 text-xs text-zinc-200">
        <input
          id={`rearm-ack-${where}`}
          type="checkbox"
          checked={sim.rearm.ack}
          onChange={(e) => ack(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-600 accent-[#C6FF00]"
        />
        Positions flat, orders cancelled, halt reason reviewed
      </label>
      <button
        type="button"
        disabled={!sim.rearm.ack}
        onClick={confirm}
        className="inline-flex items-center gap-1.5 rounded-lg bg-acid px-3 py-1.5 text-xs font-semibold text-ink transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Ic n="Check" size={13} sw={2.4} /> Confirm re-arm · step 2
      </button>
      <button type="button" onClick={cancel} className="text-xs text-zinc-400 transition hover:text-zinc-200">
        Cancel <span className="font-mono tnum">({left}s)</span>
      </button>
    </div>
  );
}

export function HaltBanner() {
  const sim = useSim((st) => st.sim);
  if (!sim.halted || !sim.halt) return null;
  const h = sim.halt;
  return (
    <div className="animate-fadein border-b border-rose-500/30 bg-gradient-to-r from-rose-500/[0.14] via-rose-500/[0.07] to-transparent">
      <div className="content-x flex flex-wrap items-center gap-3 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-500 text-white shadow-glowrose">
          <Ic n="OctagonX" size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-rose-100">HALTED · {h.reason}</p>
          <p className="text-xs text-rose-200/70">
            {plural(h.cancelled, 'order')} cancelled · {plural(h.flattened, 'position')} flattened in {h.flatMs} s ({inr(h.pnl, 2, true)}) · new orders locked since {hms(h.at)} IST
          </p>
        </div>
        <Rearm where="banner" />
      </div>
    </div>
  );
}
