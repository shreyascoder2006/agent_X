// Candles + volume for one NSE symbol on the tape, with entry / stop / target lines and
// BUY / STOP / KILL markers. Created once; live ticks update the last bar in place.
import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useTape, barStart, chartTime } from '../../lib/tape.js';
import { UNI } from '../../data/universe.js';
import { baseOptions, LW, LineStyle } from './lw.js';
import { DrawIn } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { fmtP, pct } from '../../lib/format.js';

export const vol = (v) => (v >= 1e5 ? `${(v / 1e5).toFixed(2)}L` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : String(v));

const toCandle = (b) => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close });
const toVol = (b) => ({ time: b.time, value: b.volume, color: b.close >= b.open ? LW.upVol : LW.downVol });

const MARK = {
  BUY: { position: 'belowBar', color: LW.up, shape: 'arrowUp' },
  STOP: { position: 'aboveBar', color: LW.down, shape: 'arrowDown' },
  TARGET: { position: 'aboveBar', color: LW.up, shape: 'arrowDown' },
  KILL: { position: 'aboveBar', color: LW.down, shape: 'square' },
};

function Legend({ sym, bar, prev, compact }) {
  if (!bar) return null;
  const chg = prev ? bar.close / prev - 1 : 0;
  const up = bar.close >= bar.open;
  const cells = [
    ['O', fmtP(bar.open)],
    ['H', fmtP(bar.high)],
    ['L', fmtP(bar.low)],
    ['C', fmtP(bar.close)],
  ];
  return (
    <div className="pointer-events-none absolute left-3 top-2 z-10 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-cap">
      <span className="font-semibold text-fg">{sym}</span>
      <span className="text-fg-3">5m · NSE</span>
      {cells.map(([k, v]) => (
        <span key={k} className="num">
          <span className="text-fg-3">{k}</span> <span className={up ? 'text-fg' : 'text-fg'}>{v}</span>
        </span>
      ))}
      <span className={cx('num', chg >= 0 ? 'text-lime' : 'text-risk-text')}>{pct(chg)}</span>
      {!compact && (
        <span className="num">
          <span className="text-fg-3">Vol</span> <span className="text-fg-2">{vol(bar.volume)}</span>
        </span>
      )}
    </div>
  );
}

export function PriceChart({ sym, height = 320, levels, markers, compact, className }) {
  const host = useRef(null);
  const api = useRef(null);
  const [hover, setHover] = useState(null);
  const { bars, v } = useTape(sym);

  useEffect(() => {
    const chart = createChart(host.current, {
      ...baseOptions(),
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)', scaleMargins: { top: 0.14, bottom: 0.22 } },
    });
    const candles = chart.addCandlestickSeries({
      upColor: LW.upBody,
      downColor: LW.downBody,
      borderVisible: false,
      wickUpColor: LW.upWick,
      wickDownColor: LW.downWick,
      priceLineColor: 'rgba(236,238,241,0.35)',
      priceLineStyle: LineStyle.Dotted,
    });
    const volume = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol', lastValueVisible: false, priceLineVisible: false });
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });
    const onMove = (param) => {
      const d = param && param.time ? param.seriesData.get(candles) : null;
      if (!d) return setHover(null);
      const vb = param.seriesData.get(volume);
      return setHover({ ...d, volume: vb ? vb.value : 0 });
    };
    chart.subscribeCrosshairMove(onMove);
    api.current = { chart, candles, volume, lines: {}, len: 0, sym: null };
    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      chart.remove();
      api.current = null;
    };
  }, []);

  // bars: full reset on a new symbol or session, otherwise update the forming bar in place
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    if (a.sym !== sym || bars.length < a.len || bars.length - a.len > 3 || !a.len) {
      a.candles.setData(bars.map(toCandle));
      a.volume.setData(bars.map(toVol));
      a.chart.timeScale().fitContent();
    } else {
      for (let i = Math.max(0, a.len - 1); i < bars.length; i++) {
        a.candles.update(toCandle(bars[i]));
        a.volume.update(toVol(bars[i]));
      }
      if (bars.length !== a.len) a.chart.timeScale().fitContent();
    }
    a.len = bars.length;
    a.sym = sym;
  }, [v, sym, bars]);

  // entry / stop / target price lines
  const lk = levels ? `${levels.entry}|${levels.stop}|${levels.target}` : '';
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const want = levels
      ? {
          entry: levels.entry && { price: levels.entry, color: LW.entry, lineStyle: LineStyle.Dashed, title: 'ENTRY' },
          stop: levels.stop && { price: levels.stop, color: LW.down, lineStyle: LineStyle.Solid, title: 'STOP' },
          target: levels.target && { price: levels.target, color: LW.up, lineStyle: LineStyle.Solid, title: 'TARGET' },
        }
      : {};
    for (const k of ['entry', 'stop', 'target']) {
      const opt = want[k];
      if (opt && a.lines[k]) a.lines[k].applyOptions(opt);
      else if (opt) a.lines[k] = a.candles.createPriceLine({ lineWidth: 1, axisLabelVisible: true, ...opt });
      else if (a.lines[k]) {
        a.candles.removePriceLine(a.lines[k]);
        delete a.lines[k];
      }
    }
    // keep the stop and target on screen even when price sits far from them
    a.candles.applyOptions({
      autoscaleInfoProvider: (orig) => {
        const r = orig();
        if (!r || !levels) return r;
        const xs = [levels.stop, levels.target, levels.entry].filter(Boolean);
        return { ...r, priceRange: { minValue: Math.min(r.priceRange.minValue, ...xs), maxValue: Math.max(r.priceRange.maxValue, ...xs) } };
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lk]);

  const mk = markers ? markers.map((m) => `${m.kind}${m.t}`).join('|') : '';
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const list = (markers || [])
      .map((m) => ({ time: chartTime(barStart(m.t)), text: m.text || m.kind, ...MARK[m.kind] }))
      .sort((x, y) => x.time - y.time);
    a.candles.setMarkers(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mk, v > 0]);

  const last = bars[bars.length - 1];
  const prevClose = sym === 'NIFTY' ? null : UNI[sym]?.prev;
  return (
    <DrawIn className={cx('lw-host relative min-h-0 w-full', className)} style={{ height }}>
      <Legend sym={sym} bar={hover || last} prev={prevClose} compact={compact} />
      <div ref={host} className="absolute inset-0" />
    </DrawIn>
  );
}
