import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSim } from '../../store/useSim.js';
import { Ic, btn } from '../ui/primitives.jsx';
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
      <button type="button" onClick={start} className={cx(btn.base, btn.risk, btn.md, className)}>
        <Ic n="Unlock" size={14} /> Re-arm · step 1 of 2
      </button>
    );
  }
  const left = Math.max(0, Math.ceil((sim.rearm.until - now) / 1000));
  return (
    <div className={cx('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-risk/30 bg-bg/70 px-3 py-2', className)}>
      <label htmlFor={`rearm-ack-${where}`} className="flex cursor-pointer items-center gap-2 text-cap text-fg">
        <input
          id={`rearm-ack-${where}`}
          type="checkbox"
          checked={sim.rearm.ack}
          onChange={(e) => ack(e.target.checked)}
          className="h-4 w-4 rounded border-line accent-[#C6FF00]"
        />
        Positions flat, orders cancelled, halt reason reviewed
      </label>
      <button type="button" disabled={!sim.rearm.ack} onClick={confirm} className={cx(btn.base, btn.primary, btn.sm, 'font-semibold')}>
        <Ic n="Check" size={13} sw={2.4} /> Confirm re-arm · step 2
      </button>
      <button type="button" onClick={cancel} className="text-cap text-fg-3 transition hover:text-fg">
        Cancel <span className="num">({left}s)</span>
      </button>
    </div>
  );
}

/** Slim persistent strip while trading is halted. */
export function HaltBanner() {
  const sim = useSim((st) => st.sim);
  return (
    <AnimatePresence initial={false}>
      {sim.halted && sim.halt && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          className="relative z-20 overflow-hidden border-b border-risk/25 bg-risk/[0.07]"
        >
          <div className="content-x flex flex-wrap items-center gap-x-4 gap-y-2 py-2">
            <span className="flex items-center gap-2 text-body font-semibold text-risk-text">
              <Ic n="OctagonX" size={16} /> Trading halted
            </span>
            <span className="min-w-0 flex-1 truncate text-cap text-fg-2">
              {sim.halt.reason} · {plural(sim.halt.cancelled, 'order')} cancelled · {plural(sim.halt.flattened, 'position')} flat in {sim.halt.flatMs} s ({inr(sim.halt.pnl, 2, true)}) ·
              locked since <span className="num">{hms(sim.halt.at)}</span> IST
            </span>
            <Rearm where="banner" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Screen-level reaction: rose pulse around the edge and a HALTED stamp; a lime sweep on re-arm. */
export function HaltFX() {
  const halted = useSim((st) => st.sim.halted);
  const mode = useSim((st) => st.sim.mode);
  const demoId = useSim((st) => st.sim.demo?.id);
  const prev = useRef({ halted, key: `${mode}${demoId}` });
  const [fx, setFx] = useState(null);
  useEffect(() => {
    const key = `${mode}${demoId}`;
    const was = prev.current;
    prev.current = { halted, key };
    if (was.key !== key) return undefined; // switching sessions is not a halt
    if (!was.halted && halted) setFx({ kind: 'halt', n: Date.now() });
    else if (was.halted && !halted) setFx({ kind: 'rearm', n: Date.now() });
    return undefined;
  }, [halted, mode, demoId]);
  useEffect(() => {
    if (!fx) return undefined;
    const id = setTimeout(() => setFx(null), fx.kind === 'halt' ? 2200 : 1000);
    return () => clearTimeout(id);
  }, [fx]);

  return (
    <>
      {halted && <div className="pointer-events-none fixed inset-0 z-[60] shadow-[inset_0_0_0_1px_rgba(244,63,94,0.35)]" />}
      <AnimatePresence>
        {fx?.kind === 'halt' && (
          <motion.div key={fx.n} className="pointer-events-none fixed inset-0 z-[61] grid place-items-center" exit={{ opacity: 0, transition: { duration: 0.4 } }}>
            <div className="absolute inset-0 animate-edge" />
            <motion.div
              initial={{ scale: 1.6, opacity: 0, rotate: -9 }}
              animate={{ scale: 1, opacity: 1, rotate: -7, transition: { type: 'spring', stiffness: 360, damping: 18 } }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="rounded-xl border-[3px] border-risk/90 bg-bg/40 px-8 py-3 text-[56px] font-bold leading-none tracking-[0.12em] text-risk-text shadow-[0_0_80px_rgba(244,63,94,0.35)] backdrop-blur-[1px]"
            >
              HALTED
            </motion.div>
          </motion.div>
        )}
        {fx?.kind === 'rearm' && (
          <motion.div key={fx.n} className="pointer-events-none fixed inset-x-0 top-0 z-[61] h-[3px] overflow-hidden" exit={{ opacity: 0 }}>
            <div className="h-full w-full animate-sweep bg-gradient-to-r from-transparent via-lime to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
