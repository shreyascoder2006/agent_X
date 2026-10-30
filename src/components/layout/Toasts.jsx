import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSim } from '../../store/useSim.js';
import { Ic } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { hms } from '../../lib/format.js';

const STYLE = {
  acid: { icon: 'CircleCheck', c: 'text-lime', bar: 'bg-lime/70' },
  rose: { icon: 'OctagonX', c: 'text-risk-text', bar: 'bg-risk' },
  amber: { icon: 'TriangleAlert', c: 'text-warn-text', bar: 'bg-warn' },
};

export function Toasts() {
  const toasts = useSim((st) => st.sim.toasts);
  const t = useSim((st) => st.sim.t);
  const dismiss = useSim((st) => st.dismissToast);
  const born = useRef(new Map());
  for (const x of toasts) if (!born.current.has(x.id)) born.current.set(x.id, t);
  return (
    <div
      className="pointer-events-none fixed z-[65] flex w-[340px] max-w-[calc(100vw-32px)] flex-col gap-2"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 100px)', right: 'max(20px, env(safe-area-inset-right, 0px))' }}
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((x) => {
          const s = STYLE[x.tone] || STYLE.acid;
          return (
            <motion.button
              layout
              key={x.id}
              type="button"
              onClick={() => dismiss(x.id)}
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 460, damping: 34 } }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
              className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-line bg-overlay/95 py-3 pl-4 pr-3 text-left shadow-pop"
            >
              <span className={cx('absolute inset-y-0 left-0 w-[2px]', s.bar)} />
              <Ic n={s.icon} size={16} className={cx('mt-0.5 shrink-0', s.c)} />
              <span className="min-w-0 flex-1">
                <span className="block text-body font-semibold text-fg">{x.title}</span>
                <span className="block text-cap text-fg-2">{x.body}</span>
              </span>
              <span className="num shrink-0 text-cap text-fg-3">{hms(born.current.get(x.id) ?? t)}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/** Follows the replay's view cues when auto-follow is on. */
export function DemoDirector() {
  const demo = useSim((st) => st.sim.demo);
  const navigate = useNavigate();
  const last = useRef('');
  const key = demo?.cue ? `${demo.id}:${demo.cue.n}` : '';
  useEffect(() => {
    if (!demo || !demo.cue || key === last.current) return;
    last.current = key;
    if (demo.autoFollow) navigate(`/${demo.cue.view}`);
  }, [key, demo, navigate]);
  return null;
}
