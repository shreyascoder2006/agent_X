import { useEffect, useState } from 'react';
import { useSim } from '../../store/useSim.js';
import { DEMO_STEPS, DEMO_END, KILL_CUE } from '../../sim/index.js';
import { Ic, Toggle } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { mmss } from '../../lib/format.js';

const btn =
  'inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-card px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/60';

export function DemoBar() {
  const D = useSim((st) => st.sim.demo);
  const halted = useSim((st) => st.sim.halted);
  const setPaused = useSim((st) => st.setPaused);
  const restart = useSim((st) => st.restartDemo);
  const exit = useSim((st) => st.exitDemo);
  const setAuto = useSim((st) => st.setAutoFollow);
  const setCaptions = useSim((st) => st.setCaptions);
  const [stay, setStay] = useState(false);
  const [left, setLeft] = useState(10);

  const finished = !!D?.finished;
  const demoId = D?.id;
  useEffect(() => {
    setStay(false);
    setLeft(10);
  }, [demoId]);
  useEffect(() => {
    if (!finished || stay) return undefined;
    const id = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, [finished, stay]);
  useEffect(() => {
    if (finished && !stay && left <= 0) exit();
  }, [finished, stay, left, exit]);

  if (!D) return null;
  const step = DEMO_STEPS[D.step];
  const killNow = D.killCue && !halted;

  return (
    <div className="pointer-events-none sticky bottom-0 z-30 px-3 pb-3 md:px-6">
      <div
        className={cx(
          'pointer-events-auto mx-auto max-w-5xl rounded-2xl border bg-panel/90 p-3 shadow-2xl backdrop-blur-xl transition-colors',
          killNow ? 'border-rose-500/60 shadow-glowrose' : 'border-line2',
        )}
      >
        {finished ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-acid text-ink">
              <Ic n="CheckCheck" size={18} sw={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">Replay complete</p>
              <p className="text-xs text-zinc-400">
                {stay ? 'Staying on the replay. Exit when you are done.' : `Returning to the live session in ${Math.max(0, left)} s.`}
              </p>
            </div>
            {!stay && (
              <button type="button" className={btn} onClick={() => setStay(true)}>
                <Ic n="Hand" size={13} /> Stay here
              </button>
            )}
            <button type="button" className={btn} onClick={restart}>
              <Ic n="RotateCcw" size={13} /> Replay again
            </button>
            <button type="button" className={cx(btn, 'border-acid/40 bg-acid text-ink hover:text-ink')} onClick={exit}>
              <Ic n="ArrowRight" size={13} /> Back to live
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-indigo-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300 ring-1 ring-indigo-400/30">
                Replay
              </span>
              <div className="min-w-0 flex-1 basis-64">
                <p className="text-sm font-semibold text-zinc-100">
                  Step {D.step + 1} of {DEMO_STEPS.length} · {step.title}
                  {D.paused && <span className="ml-2 text-xs font-medium text-amber-300">paused</span>}
                </p>
                {D.captions && (
                  <p className={cx('text-xs leading-snug', killNow ? 'font-medium text-rose-200' : 'text-zinc-400')}>
                    {killNow
                      ? `Press the kill switch now (sidebar or dashboard). Auto-press in ${Math.max(0, Math.ceil(KILL_CUE[1] - D.t))} s.`
                      : step.caption}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Toggle id="demo-follow" checked={D.autoFollow} onChange={setAuto} label="Auto-follow" />
                <button type="button" className={btn} onClick={() => setCaptions(!D.captions)} aria-pressed={D.captions}>
                  <Ic n={D.captions ? 'Captions' : 'CaptionsOff'} size={13} /> Captions
                </button>
                <button type="button" className={btn} onClick={() => setPaused(!D.paused)}>
                  <Ic n={D.paused ? 'Play' : 'Pause'} size={13} /> {D.paused ? 'Resume' : 'Pause'}
                </button>
                <button type="button" className={btn} onClick={restart}>
                  <Ic n="RotateCcw" size={13} /> Restart
                </button>
                <button type="button" className={btn} onClick={exit} aria-label="Exit replay">
                  <Ic n="X" size={13} />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-[11px] text-zinc-400 tnum">{mmss(D.t)}</span>
              <div className="relative h-1.5 flex-1 rounded-full bg-white/[0.06]">
                <div className="absolute inset-y-0 left-0 rounded-full bg-acid transition-[width] duration-200 ease-linear" style={{ width: `${(D.t / DEMO_END) * 100}%` }} />
                {DEMO_STEPS.map((st, i) => (
                  <span
                    key={st.title}
                    title={st.title}
                    className={cx(
                      'absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-panel transition-colors',
                      D.t >= st.at ? 'bg-acid' : 'bg-zinc-600',
                      i === D.step && 'scale-125',
                    )}
                    style={{ left: `${(st.at / DEMO_END) * 100}%` }}
                  />
                ))}
              </div>
              <span className="font-mono text-[11px] text-zinc-500 tnum">{mmss(DEMO_END)}</span>
            </div>
            <div className="mt-1.5 hidden justify-between px-0.5 text-[10px] uppercase tracking-wider text-zinc-600 lg:flex">
              {DEMO_STEPS.map((st, i) => (
                <span key={st.title} className={cx(i === D.step && 'text-acid')}>
                  {i + 1} {st.title}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
