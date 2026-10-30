// Portfolio equity today as a baseline series around ₹10 L, buy-and-hold as a dashed line,
// the −2% halt as a price line, and BUY / STOP / KILL markers from the sim's marks.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useSim, useDerived } from '../../store/useSim.js';
import { START, LIMIT } from '../../sim/index.js';
import { chartTime } from '../../lib/tape.js';
import { OPEN, CLOSE, inr, pct } from '../../lib/format.js';
import { baseOptions, LW, LineStyle, istTime } from './lw.js';
import { DrawIn, Empty } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';

function kindOf(label) {
  if (label.startsWith('B ')) return 'BUY';
  if (label.startsWith('K ')) return 'KILL';
  return 'STOP';
}

export function EquityChart({ height = 320, className }) {
  const host = useRef(null);
  const api = useRef(null);
  const [hover, setHover] = useState(null);
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  const open = sim.t >= OPEN;

  const data = useMemo(() => {
    if (!open) return [];
    const pts = sim.curve.map((p) => ({ t: p.t, eq: p.eq, bh: p.bh }));
    const nowT = Math.min(Math.round(sim.t), CLOSE);
    if (!pts.length || nowT > pts[pts.length - 1].t) pts.push({ t: nowT, eq: d.equity, bh: d.bhEquity });
    return pts;
  }, [open, sim.curve, sim.t, d.equity, d.bhEquity]);

  useEffect(() => {
    const chart = createChart(host.current, {
      ...baseOptions({ money: true }),
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)', scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: { ...baseOptions().timeScale, barSpacing: 3, rightOffset: 6 },
    });
    const eq = chart.addBaselineSeries({
      baseValue: { type: 'price', price: START },
      topLineColor: LW.up,
      topFillColor1: 'rgba(198,255,0,0.10)',
      topFillColor2: 'rgba(198,255,0,0.0)',
      bottomLineColor: LW.down,
      bottomFillColor1: 'rgba(244,63,94,0.0)',
      bottomFillColor2: 'rgba(244,63,94,0.10)',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: '#07080A',
      autoscaleInfoProvider: (orig) => {
        const r = orig();
        if (!r) return r;
        return { ...r, priceRange: { minValue: Math.min(r.priceRange.minValue, START - LIMIT - 1500), maxValue: Math.max(r.priceRange.maxValue, START + 3000) } };
      },
    });
    const bh = chart.addLineSeries({
      color: LW.bh,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 3,
    });
    eq.createPriceLine({ price: START - LIMIT, color: 'rgba(244,63,94,0.85)', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: true, title: '−2% HALT' });
    eq.createPriceLine({ price: START, color: 'rgba(236,238,241,0.22)', lineStyle: LineStyle.Dotted, lineWidth: 1, axisLabelVisible: false, title: '' });
    const onMove = (param) => {
      if (!param || !param.time) return setHover(null);
      const a = param.seriesData.get(eq);
      const b = param.seriesData.get(bh);
      return setHover(a ? { t: param.time, eq: a.value, bh: b ? b.value : null } : null);
    };
    chart.subscribeCrosshairMove(onMove);
    api.current = { chart, eq, bh, len: 0, key: '' };
    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      chart.remove();
      api.current = null;
    };
  }, []);

  const session = sim.mode === 'demo' ? `d${sim.demo.id}` : 'live';
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const eqd = data.map((p) => ({ time: chartTime(p.t), value: p.eq }));
    const bhd = data.map((p) => ({ time: chartTime(p.t), value: p.bh }));
    // the trailing "now" point moves every tick, so the series is re-fed in place (no re-mount);
    // the visible range only refits when the minute curve grows or the session changes
    const histLen = sim.curve.length;
    a.eq.setData(eqd);
    a.bh.setData(bhd);
    if (a.key !== session || histLen !== a.len) a.chart.timeScale().fitContent();
    a.len = histLen;
    a.key = session;
  }, [data, session, sim.curve.length]);

  // markers: snap each mark to the nearest point on the curve
  const mk = `${session}:${sim.marks.map((m) => m.k).join(',')}:${sim.halt ? sim.halt.at : ''}`;
  useEffect(() => {
    const a = api.current;
    if (!a || !data.length) return;
    const times = data.map((p) => p.t);
    const snap = (t) => times.reduce((best, x) => (Math.abs(x - t) < Math.abs(best - t) ? x : best), times[0]);
    const list = sim.marks.map((m) => {
      const kind = kindOf(m.label);
      return {
        time: chartTime(snap(m.t)),
        position: kind === 'BUY' ? 'belowBar' : 'aboveBar',
        color: kind === 'BUY' ? LW.up : LW.down,
        shape: kind === 'BUY' ? 'arrowUp' : kind === 'KILL' ? 'square' : 'arrowDown',
        text: `${kind} ${m.label.slice(2)}`,
      };
    });
    if (sim.halt && !sim.marks.some((m) => m.label.startsWith('K '))) {
      list.push({ time: chartTime(snap(sim.halt.at)), position: 'aboveBar', color: LW.down, shape: 'square', text: 'HALT' });
    }
    list.sort((x, y) => x.time - y.time);
    a.eq.setMarkers(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mk, data.length > 0]);

  const last = data[data.length - 1];
  const shown = hover || (last ? { t: chartTime(last.t), eq: last.eq, bh: last.bh } : null);
  return (
    <DrawIn className={cx('lw-host relative min-h-0 w-full', className)} style={{ height }}>
      {shown && (
        <div className="pointer-events-none absolute left-3 top-2 z-10 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-cap">
          <span className="num text-fg-3">{istTime(shown.t)} IST</span>
          <span className="flex items-center gap-1.5">
            <span className="h-[2px] w-3 rounded-full bg-fg" />
            <span className="text-fg-2">Niyam</span>
            <span className="num text-fg">{inr(shown.eq)}</span>
            <span className={cx('num', shown.eq >= START ? 'text-lime' : 'text-risk-text')}>{pct(shown.eq / START - 1)}</span>
          </span>
          {shown.bh != null && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 border-t border-dashed border-fg-2" />
              <span className="text-fg-2">NIFTY 50 buy-and-hold</span>
              <span className="num text-fg-2">{pct(shown.bh / START - 1)}</span>
            </span>
          )}
        </div>
      )}
      <div ref={host} className="absolute inset-0" />
      {!data.length && (
        <div className="absolute inset-0 flex">
          <Empty icon="Hourglass" title="Waiting for the 09:15 open">
            The equity curve starts with the first bar of the session.
          </Empty>
        </div>
      )}
    </DrawIn>
  );
}
