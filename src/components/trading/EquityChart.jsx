import { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot,
} from 'recharts';
import { useSim, useDerived } from '../../store/useSim.js';
import { START, LIMIT } from '../../sim/index.js';
import { OPEN, CLOSE, T, hm, inr, lakh, pct } from '../../lib/format.js';
import { Ic } from '../ui/primitives.jsx';

const HOURS = [OPEN, T(10), T(11), T(12), T(13), T(14), T(15), CLOSE];
const AXIS = { fontSize: 11, fill: '#71717a', fontFamily: 'Geist Mono, ui-monospace, monospace' };

function TipBox({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line2 bg-panel/95 px-3 py-2 text-xs shadow-2xl backdrop-blur">
      <p className="mb-1 font-mono text-zinc-400">{hm(p.t)} IST</p>
      <p className="flex items-center justify-between gap-6">
        <span className="flex items-center gap-1.5 text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-acid" />
          Niyam
        </span>
        <span className="font-mono text-zinc-100 tnum">
          {inr(p.eq)} <span className={p.eq >= START ? 'text-acid' : 'text-rose-400'}>{pct(p.eq / START - 1)}</span>
        </span>
      </p>
      <p className="flex items-center justify-between gap-6">
        <span className="flex items-center gap-1.5 text-zinc-300">
          <span className="h-0.5 w-2 bg-zinc-400" />
          Buy-and-hold
        </span>
        <span className="font-mono text-zinc-100 tnum">
          {inr(p.bh)} <span className={p.bh >= START ? 'text-acid' : 'text-rose-400'}>{pct(p.bh / START - 1)}</span>
        </span>
      </p>
    </div>
  );
}

export function EquityChart({ height = 280, showLimit = true, fill = false }) {
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  const open = sim.t >= OPEN;
  const data = useMemo(
    () => (open ? [...sim.curve, { t: Math.min(Math.round(sim.t), CLOSE), eq: d.equity, bh: d.bhEquity }] : []),
    [open, sim.curve, sim.t, d.equity, d.bhEquity],
  );

  if (!data.length || data.length < 2) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed border-line text-sm text-zinc-500" style={{ height: fill ? '100%' : height, minHeight: height }}>
        <span className="flex items-center gap-2">
          <Ic n="Hourglass" size={15} /> Waiting for the 09:15 open
        </span>
      </div>
    );
  }

  const vals = data.flatMap((p) => [p.eq, p.bh]);
  let lo = Math.min(START, ...vals);
  const hi = Math.max(START, ...vals);
  if (showLimit) lo = Math.min(lo, START - LIMIT);
  const pad = Math.max(1200, (hi - lo) * 0.08);
  const last = data[data.length - 1];

  return (
    <div style={{ height: fill ? '100%' : height, minHeight: height }}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 18, right: 14, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C6FF00" stopOpacity={0.26} />
            <stop offset="100%" stopColor="#C6FF00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1d1d22" vertical={false} />
        <XAxis dataKey="t" type="number" domain={[OPEN, CLOSE]} ticks={HOURS} tickFormatter={hm} tick={AXIS} tickLine={false} axisLine={{ stroke: '#26262c' }} allowDataOverflow />
        <YAxis domain={[lo - pad, hi + pad]} tickFormatter={(v) => lakh(v)} tick={AXIS} tickLine={false} axisLine={false} width={64} allowDataOverflow />
        <Tooltip content={<TipBox />} cursor={{ stroke: '#3f3f46', strokeDasharray: '3 3' }} isAnimationActive={false} />
        {showLimit && (
          <ReferenceLine
            y={START - LIMIT}
            stroke="#F43F5E"
            strokeDasharray="5 5"
            strokeOpacity={0.75}
            label={{ value: '−2% halt · ₹9.80L', position: 'insideBottomLeft', fill: '#fb7185', fontSize: 10, offset: 6 }}
          />
        )}
        <ReferenceLine y={START} stroke="#52525b" strokeDasharray="2 4" />
        {sim.halt && (
          <ReferenceLine x={sim.halt.at} stroke="#F43F5E" strokeWidth={1.5} label={{ value: 'HALT', position: 'insideTopRight', fill: '#fb7185', fontSize: 10 }} />
        )}
        <Area type="monotone" dataKey="eq" stroke="#C6FF00" strokeWidth={2} fill="url(#eqFill)" isAnimationActive={false} dot={false} activeDot={{ r: 4, fill: '#C6FF00', stroke: '#09090B' }} />
        <Line type="monotone" dataKey="bh" stroke="#a1a1aa" strokeWidth={1.4} strokeDasharray="5 4" dot={false} isAnimationActive={false} activeDot={{ r: 3 }} />
        {sim.marks.map((m) => (
          <ReferenceDot key={m.k} x={m.t} y={m.y} r={4.5} fill={m.tone} stroke="#09090B" strokeWidth={2} label={{ value: m.label, position: 'top', fill: '#d4d4d8', fontSize: 10, offset: 9 }} />
        ))}
        <ReferenceDot x={last.t} y={last.eq} r={6} fill="#C6FF00" fillOpacity={0.25} stroke="none" />
        <ReferenceDot x={last.t} y={last.eq} r={3} fill="#C6FF00" stroke="#09090B" strokeWidth={1} />
      </ComposedChart>
    </ResponsiveContainer>
    </div>
  );
}
