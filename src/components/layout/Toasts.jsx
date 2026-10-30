import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSim } from '../../store/useSim.js';
import { Ic } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';

const STYLE = {
  acid: { icon: 'CircleCheck', ring: 'border-acid/30', chip: 'bg-acid text-ink' },
  rose: { icon: 'OctagonX', ring: 'border-rose-500/40', chip: 'bg-rose-500 text-white' },
  amber: { icon: 'TriangleAlert', ring: 'border-amber-500/40', chip: 'bg-amber-400 text-ink' },
};

export function Toasts() {
  const toasts = useSim((st) => st.sim.toasts);
  const dismiss = useSim((st) => st.dismissToast);
  return (
    <div
      className="pointer-events-none fixed z-50 flex w-[320px] max-w-[calc(100vw-32px)] flex-col gap-2"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 84px)', right: 'max(16px, env(safe-area-inset-right, 0px))' }}
      aria-live="polite"
    >
      {toasts.map((t) => {
        const s = STYLE[t.tone] || STYLE.acid;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={cx('pointer-events-auto flex animate-fadein items-start gap-3 rounded-xl border bg-panel/95 p-3 text-left shadow-2xl backdrop-blur-xl', s.ring)}
          >
            <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-lg', s.chip)}>
              <Ic n={s.icon} size={15} sw={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-zinc-100">{t.title}</span>
              <span className="block text-xs text-zinc-400">{t.body}</span>
            </span>
          </button>
        );
      })}
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
