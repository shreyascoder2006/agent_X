// lightweight-charts (TradingView, Apache-2.0) theme. The attribution logo the licence asks for stays on.
import { ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';
import { DAY0 } from '../../lib/tape.js';
import { fmtP, hm, inr, lakh } from '../../lib/format.js';

export const LW = {
  up: '#C6FF00',
  down: '#F43F5E',
  upBody: 'rgba(198,255,0,0.85)',
  downBody: 'rgba(244,63,94,0.85)',
  upWick: 'rgba(198,255,0,0.55)',
  downWick: 'rgba(244,63,94,0.6)',
  upVol: 'rgba(198,255,0,0.16)',
  downVol: 'rgba(244,63,94,0.2)',
  entry: 'rgba(236,238,241,0.8)',
  bh: 'rgba(163,169,179,0.75)',
};

export const istTime = (t) => hm(t - DAY0);

export function baseOptions({ money = false } = {}) {
  return {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: '#80868F',
      fontFamily: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 11,
      attributionLogo: true,
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.035)' },
      horzLines: { color: 'rgba(255,255,255,0.035)' },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: 'rgba(236,238,241,0.28)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#181C22' },
      horzLine: { color: 'rgba(236,238,241,0.28)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#181C22' },
    },
    rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)', scaleMargins: { top: 0.1, bottom: 0.24 } },
    timeScale: {
      borderColor: 'rgba(255,255,255,0.06)',
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 3,
      barSpacing: 9,
      minBarSpacing: 3,
      fixLeftEdge: true,
      lockVisibleTimeRangeOnResize: true,
      tickMarkFormatter: (t) => istTime(t),
    },
    localization: {
      timeFormatter: (t) => `${istTime(t)} IST`,
      priceFormatter: money ? (p) => lakh(p, 3) : (p) => fmtP(p),
    },
    handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: { time: true, price: false }, axisDoubleClickReset: true },
  };
}

export const priceFmt = (p) => `₹${fmtP(p)}`;
export const moneyFmt = (v) => inr(v, 0);
export { LineStyle };
