// Market view: the 3D universe or a NIFTY 50 sector treemap sized by index weight.
import { useLayoutEffect, useRef, useState } from 'react';
import { useSim } from '../../store/useSim.js';
import { useUI } from '../../store/useUI.js';
import { SECTORS, weightOf } from '../../lib/instrument.js';
import { Panel, Segmented } from '../ui/primitives.jsx';
import UniverseScene from '../three/UniverseScene.jsx';
import { cx } from '../../lib/cx.js';
import { pct } from '../../lib/format.js';

/** Squarified treemap: lays `items` (with .weight) into the rect, returns rects in the same order. */
export function squarify(items, x, y, w, h) {
  const total = items.reduce((a, it) => a + it.weight, 0) || 1;
  const scale = (w * h) / total;
  const areas = items.map((it) => it.weight * scale);
  const out = new Array(items.length);
  let r = { x, y, w, h };
  let row = [];
  const worst = (idx, len) => {
    const s = idx.reduce((a, i) => a + areas[i], 0);
    let mx = 0;
    let mn = Infinity;
    for (const i of idx) {
      mx = Math.max(mx, areas[i]);
      mn = Math.min(mn, areas[i]);
    }
    return Math.max((len * len * mx) / (s * s), (s * s) / (len * len * mn));
  };
  const place = (idx) => {
    const s = idx.reduce((a, i) => a + areas[i], 0);
    if (r.w >= r.h) {
      const cw = s / r.h;
      let yy = r.y;
      for (const i of idx) {
        const hh = areas[i] / cw;
        out[i] = { x: r.x, y: yy, w: cw, h: hh };
        yy += hh;
      }
      r = { x: r.x + cw, y: r.y, w: r.w - cw, h: r.h };
    } else {
      const rh = s / r.w;
      let xx = r.x;
      for (const i of idx) {
        const ww = areas[i] / rh;
        out[i] = { x: xx, y: r.y, w: ww, h: rh };
        xx += ww;
      }
      r = { x: r.x, y: r.y + rh, w: r.w, h: r.h - rh };
    }
  };
  let i = 0;
  while (i < areas.length) {
    const len = Math.min(r.w, r.h);
    if (!row.length || worst([...row, i], len) <= worst(row, len)) {
      row.push(i);
      i += 1;
    } else {
      place(row);
      row = [];
    }
  }
  if (row.length) place(row);
  return out;
}

export function heatColor(chg) {
  const k = Math.min(1, Math.abs(chg) / 0.02);
  return chg >= 0 ? `rgba(198,255,0,${(0.03 + 0.13 * k).toFixed(3)})` : `rgba(244,63,94,${(0.05 + 0.22 * k).toFixed(3)})`;
}

export function Heatmap({ height = 340 }) {
  const box = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const universe = useSim((st) => st.sim.universe);
  const positions = useSim((st) => st.sim.positions);
  const openDrawer = useUI((s) => s.openDrawer);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const held = new Set(positions.map((p) => p.sym));
  const sectorRects = size.w ? squarify(SECTORS, 0, 0, size.w, size.h) : [];
  return (
    <div className="flex flex-1 flex-col">
      <div ref={box} className="relative w-full flex-1 overflow-hidden rounded-lg" style={{ minHeight: height }}>
        {sectorRects.map((sr, si) => {
          const sec = SECTORS[si];
          const head = sr.h > 46 && sr.w > 54 ? 18 : 0;
          const items = sec.items.map((u) => ({ ...u, weight: weightOf(u.sym) })).sort((a, b) => b.weight - a.weight);
          const rects = squarify(items, sr.x + 1, sr.y + head + 1, Math.max(0, sr.w - 2), Math.max(0, sr.h - head - 2));
          let sum = 0;
          let wsum = 0;
          for (const u of items) {
            sum += (universe[u.sym].p / u.prev - 1) * u.weight;
            wsum += u.weight;
          }
          const sChg = sum / wsum;
          return (
            <div key={sec.name}>
              <div className="absolute border border-bg" style={{ left: sr.x, top: sr.y, width: sr.w, height: sr.h }} />
              {head > 0 && (
                <div className="absolute flex items-center justify-between gap-1 overflow-hidden px-1.5 text-cap" style={{ left: sr.x, top: sr.y, width: sr.w, height: head }}>
                  <span className="truncate text-fg-3">{sec.name}</span>
                  {sr.w > 110 && <span className={cx('num', sChg >= 0 ? 'text-lime/80' : 'text-risk-text/90')}>{pct(sChg)}</span>}
                </div>
              )}
              {items.map((u, i) => {
                const rc = rects[i];
                const chg = universe[u.sym].p / u.prev - 1;
                const big = rc.w > 64 && rc.h > 34;
                const tiny = rc.w < 34 || rc.h < 18;
                return (
                  <button
                    key={u.sym}
                    type="button"
                    onClick={() => openDrawer(u.sym)}
                    title={`${u.sym} · ${u.sector} · ${pct(chg)}`}
                    className={cx('hit absolute flex flex-col items-center justify-center overflow-hidden rounded-[3px] border border-bg text-center transition-colors duration-500', held.has(u.sym) && 'ring-1 ring-inset ring-lime/70')}
                    style={{ left: rc.x, top: rc.y, width: rc.w, height: rc.h, background: `linear-gradient(${heatColor(chg)}, ${heatColor(chg)}), #12151A` }}
                  >
                    {!tiny && <span className={cx('truncate px-1 font-semibold text-fg', big ? 'text-body' : 'text-[10px] leading-3')}>{u.sym}</span>}
                    {big && <span className={cx('num text-cap', chg >= 0 ? 'text-lime' : 'text-risk-text')}>{pct(chg)}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-cap text-fg-3">
        <span className="num">−2%</span>
        <span className="h-1.5 w-40 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(244,63,94,0.75), rgba(244,63,94,0.12), #12151A 50%, rgba(198,255,0,0.12), rgba(198,255,0,0.5))' }} />
        <span className="num">+2%</span>
        <span className="ml-2">size = index weight · outlined = held · click a tile for the instrument</span>
      </div>
    </div>
  );
}

export function MarketView({ className, height = 340 }) {
  const mode = useUI((s) => s.market);
  const setMode = useUI((s) => s.setMarket);
  return (
    <Panel
      className={className}
      title="Market · NIFTY 50"
      meta={mode === '3d' ? 'Column height = move today, grouped by sector · a light sweeps on every scan' : 'Sector treemap · tile size = index weight · colour = move today'}
      actions={
        <Segmented
          size="sm"
          label="Market view"
          value={mode}
          onChange={setMode}
          options={[
            { id: '3d', label: '3D', icon: 'Box' },
            { id: 'heatmap', label: 'Heatmap', icon: 'LayoutGrid' },
          ]}
        />
      }
    >
      {mode === '3d' ? <UniverseScene height={height} fill /> : <Heatmap height={height} />}
    </Panel>
  );
}
