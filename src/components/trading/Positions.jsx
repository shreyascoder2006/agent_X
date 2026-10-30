import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSim } from '../../store/useSim.js';
import { Card, Flash, Ic, Pill } from '../ui/primitives.jsx';
import { STRATEGIES } from '../../data/constants.js';
import { cx } from '../../lib/cx.js';
import { fmtP, hm, inr, pct, rStr } from '../../lib/format.js';

/** Where the price sits between the stop (left) and the target (right). */
function RangeBar({ stop, entry, target, px }) {
  const span = target - stop;
  const at = (v) => Math.max(0, Math.min(100, ((v - stop) / span) * 100));
  const up = px >= entry;
  return (
    <div className="relative h-5 min-w-[150px]">
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-500/50 via-zinc-700 to-acid/50" />
      <div className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-zinc-400" style={{ left: `${at(entry)}%` }} title={`entry ₹${fmtP(entry)}`} />
      <div
        className={cx('absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card transition-[left] duration-500', up ? 'bg-acid shadow-glowsm' : 'bg-rose-400')}
        style={{ left: `${at(px)}%` }}
      />
    </div>
  );
}

export function PositionsTable({ className }) {
  const sim = useSim((st) => st.sim);
  const [hover, setHover] = useState(null);
  const rows = sim.positions;
  const closed = sim.closed.slice(-3).reverse();

  return (
    <Card
      className={cx('flex flex-col', className)}
      title="Open positions"
      icon="Layers"
      sub="Bracket orders on the paper broker · hover a row for details"
      right={<Pill tone={rows.length ? 'acid' : 'zinc'}>{rows.length} of 4 slots</Pill>}
      body="flex flex-1 flex-col pb-2"
    >
      <div className="scroll-thin flex-1 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-y border-line text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2 text-left font-medium">Symbol</th>
              <th className="px-2 py-2 text-right font-medium">Qty</th>
              <th className="px-2 py-2 text-right font-medium">Avg</th>
              <th className="px-2 py-2 text-right font-medium">LTP</th>
              <th className="px-2 py-2 text-right font-medium">P&amp;L</th>
              <th className="px-3 py-2 text-left font-medium">Stop · price · target</th>
              <th className="px-4 py-2 text-right font-medium">R</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const px = sim.universe[p.sym].p;
              const pnl = (px - p.entry) * p.qty;
              const R = (px - p.entry) / (p.entry - p.stop);
              const open = hover === p.id;
              return (
                <Fragment key={p.id}>
                  <tr
                    onMouseEnter={() => setHover(p.id)}
                    onMouseLeave={() => setHover(null)}
                    className={cx('animate-fadein border-b border-line/60 transition-colors', open ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]')}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] font-mono text-[10px] font-semibold text-zinc-300 ring-1 ring-white/[0.06]">
                          {p.sym.slice(0, 3)}
                        </span>
                        <div>
                          <p className="font-semibold text-zinc-100">{p.sym}</p>
                          <div className="mt-0.5 flex gap-1">
                            <Pill tone="acid">BUY</Pill>
                            <Pill tone={STRATEGIES[p.strategy]?.tone || 'zinc'}>{p.strategy}</Pill>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-zinc-300 tnum">{p.qty}</td>
                    <td className="px-2 py-3 text-right font-mono text-zinc-400 tnum">{fmtP(p.entry)}</td>
                    <td className="px-2 py-3 text-right font-mono text-zinc-100 tnum">
                      <Flash v={px}>{fmtP(px)}</Flash>
                    </td>
                    <td className={cx('px-2 py-3 text-right font-mono tnum', pnl >= 0 ? 'text-acid' : 'text-rose-400')}>
                      <div>{inr(pnl, 2, true)}</div>
                      <div className="text-[11px] opacity-70">{pct(px / p.entry - 1)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <RangeBar stop={p.stop} entry={p.entry} target={p.target} px={px} />
                      <div className="flex justify-between font-mono text-[10px] text-zinc-500 tnum">
                        <span className="text-rose-300/80">{fmtP(p.stop)}</span>
                        <span className="text-acid/80">{fmtP(p.target)}</span>
                      </div>
                    </td>
                    <td className={cx('px-4 py-3 text-right font-mono tnum', R >= 0 ? 'text-acid' : 'text-rose-400')}>{rStr(R)}</td>
                  </tr>
                  {open && (
                    <tr className="border-b border-line/60 bg-white/[0.03]">
                      <td colSpan={7} className="px-4 pb-3">
                        <div className="flex animate-fadein flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-400">
                          <span>
                            Order <span className="font-mono text-zinc-200">{p.oid}</span> · opened {hm(p.openedAt)} IST
                          </span>
                          <span>
                            Planned risk <span className="font-mono text-zinc-200">{inr((p.entry - p.stop) * p.qty)}</span> ({pct(((p.entry - p.stop) * p.qty) / 1e6, 2, false)})
                          </span>
                          <span>
                            Value <span className="font-mono text-zinc-200">{inr(px * p.qty)}</span>
                          </span>
                          <Link to="/journal" className="inline-flex items-center gap-1 text-acid hover:underline">
                            Journal {p.journal} <Ic n="ArrowUpRight" size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8">
                  <div className="relative mx-auto max-w-md overflow-hidden rounded-xl border border-dashed border-line px-4 py-5 text-center">
                    <div className="absolute inset-y-0 left-0 w-1/3 animate-scan bg-gradient-to-r from-transparent via-acid/[0.07] to-transparent" />
                    <p className="text-sm font-medium text-zinc-300">{sim.halted ? 'Flat and locked' : 'No open positions'}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {sim.halted ? 'The kill switch flattened everything. Re-arm to resume.' : 'Scanning 50 stocks; entries need a passed backtest gate and risk check.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {closed.map((c) => (
              <tr key={`${c.sym}${c.closedAt}`} className="border-b border-line/40 text-zinc-500">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-400">{c.sym}</span>
                    <Pill tone={c.reason === 'stop' || c.reason === 'kill' ? 'rose' : 'acid'}>
                      {c.reason === 'kill' ? 'flattened · kill switch' : c.reason === 'stop' ? 'stopped out' : 'closed'}
                    </Pill>
                  </div>
                </td>
                <td className="px-2 text-right font-mono tnum">{c.qty}</td>
                <td className="px-2 text-right font-mono tnum">{fmtP(c.entry)}</td>
                <td className="px-2 text-right font-mono tnum">{fmtP(c.exit)}</td>
                <td className={cx('px-2 text-right font-mono tnum', c.pnl >= 0 ? 'text-acid/70' : 'text-rose-400/80')}>{inr(c.pnl, 2, true)}</td>
                <td className="px-3 text-xs">closed {hm(c.closedAt)} IST</td>
                <td className={cx('px-4 text-right font-mono tnum', c.R >= 0 ? 'text-acid/70' : 'text-rose-400/80')}>{rStr(c.R)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Totals sim={sim} />
    </Card>
  );
}

function Totals({ sim }) {
  let value = 0;
  let unreal = 0;
  let risk = 0;
  for (const p of sim.positions) {
    const px = sim.universe[p.sym].p;
    value += px * p.qty;
    unreal += (px - p.entry) * p.qty;
    risk += (p.entry - p.stop) * p.qty;
  }
  const cells = [
    ['Open value', inr(value), 'text-zinc-100'],
    ['Unrealized', inr(unreal, 2, true), unreal >= 0 ? 'text-acid' : 'text-rose-400'],
    ['Realized today', inr(sim.realized, 2, true), sim.realized >= 0 ? 'text-zinc-100' : 'text-rose-400'],
    ['Open risk to stops', inr(risk), 'text-zinc-100'],
  ];
  return (
    <div className="mx-4 mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3 sm:grid-cols-4">
      {cells.map(([k, v, c]) => (
        <div key={k} className="rounded-lg bg-white/[0.02] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</p>
          <p className={cx('font-mono text-sm tnum', c)}>{v}</p>
        </div>
      ))}
    </div>
  );
}

const ORDER_TONE = { open: 'acid', filled: 'green', cancelled: 'zinc' };

export function OrdersList({ className }) {
  const orders = useSim((st) => st.sim.orders);
  const list = [...orders].reverse().slice(0, 6);
  return (
    <Card className={className} title="Working orders" icon="Send" right={<Pill tone="zinc">{orders.filter((o) => o.status === 'open').length} open</Pill>}>
      <ul className="space-y-1.5">
        {list.map((o) => (
          <li
            key={o.id}
            className={cx('flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-2 text-xs transition', o.status !== 'open' && 'opacity-55')}
          >
            <Pill tone={o.kind === 'SL-M' ? 'rose' : 'acid'} mono className="w-12 justify-center">
              {o.kind}
            </Pill>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block font-medium text-zinc-200">
                {o.sym} <span className="text-zinc-500">× {o.qty}</span>
              </span>
              <span className="block font-mono text-[11px] text-zinc-500 tnum">sell @ ₹{fmtP(o.price)}</span>
            </span>
            <Pill tone={ORDER_TONE[o.status]} dot={o.status === 'open'} pulse={o.status === 'open'}>
              {o.status}
            </Pill>
          </li>
        ))}
        {!list.length && <li className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-zinc-500">No orders yet today</li>}
      </ul>
    </Card>
  );
}
