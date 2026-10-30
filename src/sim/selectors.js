// Values derived from the sim state, computed once per render.
import { UNIVERSE } from '../data/universe.js';
import { OPEN, CLOSE, loopNo, marketStatus } from '../lib/format.js';
import { START, LIMIT } from './core.js';

export function derive(s) {
  let posVal = 0;
  let unreal = 0;
  let openRisk = 0;
  let cost = 0;
  for (const p of s.positions) {
    const px = s.universe[p.sym].p;
    posVal += px * p.qty;
    unreal += (px - p.entry) * p.qty;
    openRisk += Math.max(0, p.entry - p.stop) * p.qty;
    cost += p.entry * p.qty;
  }
  const dayPnl = s.realized + unreal;
  const equity = START + dayPnl;
  const bhPct = s.t < OPEN ? 0 : s.nifty.p / s.nifty.open - 1;
  let adv = 0;
  let dec = 0;
  for (const u of UNIVERSE) {
    const p = s.universe[u.sym].p;
    if (p > u.prev) adv += 1;
    else if (p < u.prev) dec += 1;
  }
  const loop = loopNo(s.t);
  return {
    posVal,
    unreal,
    realized: s.realized,
    dayPnl,
    dayPct: dayPnl / START,
    equity,
    cash: START + s.realized - cost,
    bhPct,
    bhEquity: START * (1 + bhPct),
    used: Math.max(0, -dayPnl) / LIMIT,
    headroom: LIMIT + dayPnl,
    exposure: posVal / equity,
    openRisk,
    adv,
    dec,
    loop,
    loopProgress: s.t < OPEN ? 0 : loop >= 25 ? 1 : ((s.t - OPEN) % 900) / 900,
    nextLoop: loop >= 25 ? CLOSE : OPEN + loop * 900,
    status: marketStatus(s.t),
  };
}

export const checkState = (c, rt) => (c.at <= rt ? c.res : 'pending');
