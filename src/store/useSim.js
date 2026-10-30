// Global store: the simulation state plus the actions the UI can take on it.
import { useMemo } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  step, createLiveState, createDemoState, engageKill, rearmStart, rearmAck, rearmConfirm, rearmCancel, LIVE_END,
} from '../sim/index.js';
import { derive } from '../sim/selectors.js';

export const useSim = create(
  immer((set) => ({
    sim: createLiveState(),
    saved: null, // the live session, parked while a replay runs

    tick: (dt) =>
      set((st) => {
        step(st.sim, dt);
        if (st.sim.mode === 'live' && st.sim.t >= LIVE_END) st.sim = createLiveState();
      }),

    kill: () => set((st) => { engageKill(st.sim, 'human'); }),
    rearmStart: () => set((st) => { rearmStart(st.sim); }),
    rearmAck: (v) => set((st) => { rearmAck(st.sim, v); }),
    rearmConfirm: () => set((st) => { rearmConfirm(st.sim); }),
    rearmCancel: () => set((st) => { rearmCancel(st.sim); }),
    dismissToast: (id) => set((st) => { st.sim.toasts = st.sim.toasts.filter((t) => t.id !== id); }),

    startDemo: () =>
      set((st) => {
        if (st.sim.mode === 'live') st.saved = st.sim;
        st.sim = createDemoState();
      }),
    restartDemo: () => set((st) => { st.sim = createDemoState(); }),
    exitDemo: () =>
      set((st) => {
        st.sim = st.saved || createLiveState();
        st.saved = null;
      }),
    setPaused: (p) =>
      set((st) => {
        const D = st.sim.demo;
        if (D && !D.finished) D.paused = p;
      }),
    setAutoFollow: (v) => set((st) => { if (st.sim.demo) st.sim.demo.autoFollow = v; }),
    setCaptions: (v) => set((st) => { if (st.sim.demo) st.sim.demo.captions = v; }),
  })),
);

/** Derived numbers (equity, P&L, exposure…) for the current tick. */
export function useDerived() {
  const sim = useSim((st) => st.sim);
  return useMemo(() => derive(sim), [sim]);
}

let timer = null;

/** Starts the 5 Hz engine loop. Returns a stop function (safe under StrictMode). */
export function startEngine() {
  if (timer) return () => {};
  let last = performance.now();
  timer = setInterval(() => {
    const now = performance.now();
    const dt = Math.min(0.5, (now - last) / 1000);
    last = now;
    useSim.getState().tick(dt);
  }, 200);
  return () => {
    clearInterval(timer);
    timer = null;
  };
}
