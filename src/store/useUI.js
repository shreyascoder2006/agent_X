// Presentation-only state: drawers, palette, notifications, demo cinematics. The sim never reads it.
import { create } from 'zustand';
import { useSim } from './useSim.js';

const sessionKey = (sim) => (sim.mode === 'demo' ? `demo:${sim.demo.id}` : 'live');

export const useUI = create((set) => ({
  drawer: null, // symbol shown in the instrument drawer
  openDrawer: (sym) => set({ drawer: sym }),
  closeDrawer: () => set({ drawer: null }),

  palette: false,
  setPalette: (v) => set((s) => ({ palette: typeof v === 'function' ? v(s.palette) : v })),

  notifications: [], // toast history, newest first
  unread: 0,
  markRead: () => set({ unread: 0 }),
  clearNotifications: () => set({ notifications: [], unread: 0 }),

  market: '3d',
  setMarket: (market) => set({ market }),

  spotlight: true,
  setSpotlight: (spotlight) => set({ spotlight }),

  intro: false,
  setIntro: (intro) => set({ intro }),
}));

/** Starts the replay behind a 3-second branded card. The replay waits, paused, so its timings are unchanged. */
let introTimer = null;
export function startDemoWithIntro(kind = 'start') {
  const sim = useSim.getState();
  if (kind === 'restart') sim.restartDemo();
  else sim.startDemo();
  useSim.getState().setPaused(true);
  useUI.getState().setIntro(true);
  clearTimeout(introTimer);
  introTimer = setTimeout(endIntro, 3000);
}
export function endIntro() {
  clearTimeout(introTimer);
  if (!useUI.getState().intro) return;
  useUI.getState().setIntro(false);
  const D = useSim.getState().sim.demo;
  if (D && !D.finished) useSim.getState().setPaused(false);
}

// Keep a history of every toast the sim raises, for the notifications bell.
const seen = new Set();
useSim.subscribe((st) => {
  const sim = st.sim;
  if (!sim.toasts.length) return;
  const key = sessionKey(sim);
  const fresh = sim.toasts.filter((t) => !seen.has(`${key}:${t.id}`));
  if (!fresh.length) return;
  for (const t of fresh) seen.add(`${key}:${t.id}`);
  useUI.setState((s) => ({
    notifications: [
      ...fresh.map((t) => ({ id: `${key}:${t.id}`, tone: t.tone, title: t.title, body: t.body, t: Math.round(sim.t), mode: sim.mode })).reverse(),
      ...s.notifications,
    ].slice(0, 40),
    unread: s.unread + fresh.length,
  }));
});
