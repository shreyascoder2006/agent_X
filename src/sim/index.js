import { runQueue, postStep } from './core.js';
import { stepLive } from './live.js';
import { stepDemo } from './replay.js';

export {
  START, LIMIT, engageKill, rearmStart, rearmAck, rearmConfirm, rearmCancel, equityOf, bhOf,
} from './core.js';
export { createLiveState, LIVE_END, LIVE_SPEED } from './live.js';
export { createDemoState, DEMO_STEPS, DEMO_END, KILL_CUE } from './replay.js';

/** Advance the simulation by `dt` real seconds. Mutates an immer draft. */
export function step(s, dt) {
  if (s.mode === 'demo' && s.demo.paused) return;
  s.rt += dt;
  if (s.mode === 'demo') stepDemo(s, dt);
  else stepLive(s, dt);
  runQueue(s);
  postStep(s);
}
