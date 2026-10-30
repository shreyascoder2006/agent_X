// Deterministic randomness and interpolation for the simulator.

/** mulberry32: small, fast, seedable PRNG returning [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gauss(r) {
  let u = 0;
  let v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Smooth deterministic wiggle in [-1, 1]; used to make scripted prices look alive. */
export const wig = (seed, t) =>
  0.6 * Math.sin(1.7 * t + seed) + 0.3 * Math.sin(4.3 * t + 2.1 * seed) + 0.1 * Math.sin(9.7 * t + 0.7 * seed);

/** Piecewise-linear interpolation over [[x, y], ...] keyframes. */
export function interp(kf, x) {
  if (x <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) {
    if (x <= kf[i][0]) {
      const [x0, y0] = kf[i - 1];
      const [x1, y1] = kf[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return kf[kf.length - 1][1];
}

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/** NSE tick size: ₹0.05. */
export const tick05 = (x) => Math.round(x * 20) / 20;
export const round1 = (x) => Math.round(x * 10) / 10;
export const round2 = (x) => Math.round(x * 100) / 100;

/** Brownian bridge with n steps from a to b (n + 1 values). */
export function bridge(r, a, b, n, sd) {
  const w = [0];
  for (let i = 1; i <= n; i++) w.push(w[i - 1] + sd * gauss(r));
  return w.map((x, i) => a + x - (i / n) * (w[n] - (b - a)));
}
