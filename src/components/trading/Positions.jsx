import { useSim } from '../../store/useSim.js';
import { useUI } from '../../store/useUI.js';
import { UNI } from '../../data/universe.js';
import { useTape, sparkOf } from '../../lib/tape.js';
import { Chip, Dot, Empty, Monogram, Panel, Spark, Tick, signTone } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { fmtP, hm, inr, pct, rStr } from '../../lib/format.js';

function RowSpark({ sym, ref0, width = 88 }) {
  const { bars } = useTape(sym);
  const data = sparkOf(bars, 36);
  const up = data.length ? data[data.length - 1] >= ref0 : true;
  return <Spark data={data} baseline={ref0} height={24} width={width} color={up ? '#C6FF00' : '#F43F5E'} fill={false} />;
}

/** Where the price sits between the stop (left) and the target (right). */
function RangeBar({ stop, entry, target, px }) {
  const span = target - stop;
  const at = (v) => Math.max(0, Math.min(100, ((v - stop) / span) * 100));
  const up = px >= entry;
  return (
    <div className="relative h-4 min-w-[120px]">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/[0.12]" />
      <div className="absolute top-1/2 h-px -translate-y-1/2 bg-risk/60" style={{ left: 0, width: `${at(entry)}%` }} />
      <div className="absolute top-1/2 h-px -translate-y-1/2 bg-lime/50" style={{ left: `${at(entry)}%`, right: 0 }} />
      <div className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-fg-2" style={{ left: `${at(entry)}%` }} title={`entry ₹${fmtP(entry)}`} />
      <div
        className={cx('absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-panel transition-[left] duration-500', up ? 'bg-lime' : 'bg-risk')}
        style={{ left: `${at(px)}%` }}
      />
    </div>
  );
}

const th = 'px-2 py-2 text-left text-cap font-medium text-fg-3';

export function PositionsTable({ className, id }) {
  const sim = useSim((st) => st.sim);
  const openDrawer = useUI((s) => s.openDrawer);
  const rows = sim.positions;
  const closed = sim.closed.slice(-3).reverse();
  let value = 0;
  let unreal = 0;
  let risk = 0;
  for (const p of rows) {
    const px = sim.universe[p.sym].p;
    value += px * p.qty;
    unreal += (px - p.entry) * p.qty;
    risk += (p.entry - p.stop) * p.qty;
  }

  return (
    <Panel
      id={id}
      className={className}
      title="Positions"
      meta="Bracket orders on the paper broker · click a row for the instrument"
      actions={<Chip>{rows.length} of 4 slots</Chip>}
      body="pb-0"
    >
      <div className="scroll-thin flex-1 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-y border-hair bg-white/[0.015]">
              <th className={cx(th, 'pl-5')}>Symbol</th>
              <th className={cx(th, 'text-right')}>Qty</th>
              <th className={cx(th, 'text-right')}>Avg</th>
              <th className={cx(th, 'text-right')}>LTP</th>
              <th className={cx(th, 'w-[96px]')}>Today</th>
              <th className={cx(th, 'text-right')}>P&amp;L</th>
              <th className={th}>Stop · target</th>
              <th className={cx(th, 'pr-5 text-right')}>R</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const px = sim.universe[p.sym].p;
              const pnl = (px - p.entry) * p.qty;
              const R = (px - p.entry) / (p.entry - p.stop);
              return (
                <tr
                  key={p.id}
                  onClick={() => openDrawer(p.sym)}
                  onKeyDown={(e) => e.key === 'Enter' && openDrawer(p.sym)}
                  tabIndex={0}
                  className="cursor-pointer border-b border-hair transition-colors hover:bg-white/[0.025] focus-visible:bg-white/[0.04]"
                >
                  <td className="py-2.5 pl-5 pr-2">
                    <div className="flex items-center gap-2.5">
                      <Monogram sym={p.sym} size={28} tone="held" />
                      <div className="leading-tight">
                        <p className="text-body font-semibold text-fg">{p.sym}</p>
                        <p className="text-cap text-fg-3">
                          {p.strategy} · <span className="num">{hm(p.openedAt)}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="num px-2 text-right text-body text-fg-2">{p.qty}</td>
                  <td className="num px-2 text-right text-body text-fg-2">{fmtP(p.entry)}</td>
                  <td className="num px-2 text-right text-body text-fg">
                    <Tick v={px}>{fmtP(px)}</Tick>
                  </td>
                  <td className="px-2">
                    <RowSpark sym={p.sym} ref0={UNI[p.sym].prev} />
                  </td>
                  <td className={cx('num px-2 text-right text-body', signTone(pnl))}>
                    <div>{inr(pnl, 2, true)}</div>
                    <div className="text-cap opacity-80">{pct(px / p.entry - 1)}</div>
                  </td>
                  <td className="px-2">
                    <RangeBar stop={p.stop} entry={p.entry} target={p.target} px={px} />
                    <div className="num flex justify-between text-cap text-fg-3">
                      <span>{fmtP(p.stop)}</span>
                      <span>{fmtP(p.target)}</span>
                    </div>
                  </td>
                  <td className={cx('num pr-5 text-right text-body', signTone(R))}>{rStr(R)}</td>
                </tr>
              );
            })}
            {closed.map((c) => (
              <tr key={`${c.sym}${c.closedAt}`} onClick={() => openDrawer(c.sym)} className="cursor-pointer border-b border-hair text-fg-3 transition-colors hover:bg-white/[0.02]">
                <td className="py-2 pl-5 pr-2">
                  <div className="flex items-center gap-2.5">
                    <Monogram sym={c.sym} size={28} />
                    <div className="leading-tight">
                      <p className="text-body font-medium text-fg-2">{c.sym}</p>
                      <p className="text-cap">{c.reason === 'kill' ? 'flattened by kill switch' : c.reason === 'stop' ? 'stopped out' : 'closed'}</p>
                    </div>
                  </div>
                </td>
                <td className="num px-2 text-right text-body">{c.qty}</td>
                <td className="num px-2 text-right text-body">{fmtP(c.entry)}</td>
                <td className="num px-2 text-right text-body">{fmtP(c.exit)}</td>
                <td className="px-2">
                  <RowSpark sym={c.sym} ref0={UNI[c.sym].prev} />
                </td>
                <td className={cx('num px-2 text-right text-body', c.pnl >= 0 ? 'text-lime/80' : 'text-risk-text/90')}>{inr(c.pnl, 2, true)}</td>
                <td className="num px-2 text-cap">closed {hm(c.closedAt)}</td>
                <td className={cx('num pr-5 text-right text-body', c.R >= 0 ? 'text-lime/80' : 'text-risk-text/90')}>{rStr(c.R)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !closed.length && (
          <div className="flex px-5 py-6">
            <Empty icon={sim.halted ? 'Lock' : 'Layers'} title={sim.halted ? 'Flat and locked' : 'No open positions'}>
              {sim.halted ? 'The kill switch flattened everything. Re-arm to resume.' : 'Entries need a passed backtest gate and a clean risk check.'}
            </Empty>
          </div>
        )}
      </div>
      <dl className="mt-auto grid grid-cols-2 border-t border-hair sm:grid-cols-4">
        {[
          ['Open value', inr(value), 'text-fg'],
          ['Unrealized', inr(unreal, 2, true), signTone(unreal)],
          ['Realized today', inr(sim.realized, 2, true), signTone(sim.realized)],
          ['Open risk to stops', inr(risk), 'text-fg'],
        ].map(([k, v, c], i) => (
          <div key={k} className={cx('px-5 py-3', i > 0 && 'sm:border-l sm:border-hair')}>
            <dt className="text-cap text-fg-3">{k}</dt>
            <dd className={cx('num text-body', c)}>{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/** Names the agent is watching, with the reason in its own words. */
const WATCH = [
  ['SUNPHARMA', 'gate failed'],
  ['HDFCBANK', 'results tmrw'],
  ['TITAN', 'RSI-2 watch'],
  ['ADANIPORTS', 'vol 1.1×'],
  ['TCS', 'ADX 19'],
  ['BEL', 'news −0.31'],
  ['RELIANCE', 'trend watch'],
];

function WatchRow({ sym, note, held }) {
  const px = useSim((st) => st.sim.universe[sym].p);
  const openDrawer = useUI((s) => s.openDrawer);
  const u = UNI[sym];
  const chg = px / u.prev - 1;
  return (
    <li>
      <button type="button" onClick={() => openDrawer(sym)} className="flex w-full items-center gap-2.5 px-5 py-2 text-left transition-colors hover:bg-white/[0.025]">
        <div className="w-[92px] min-w-0 leading-tight">
          <p className="flex items-center gap-1.5 truncate text-body font-medium text-fg">
            {sym}
            {held && <Dot tone="lime" size={5} />}
          </p>
          <p className="truncate text-cap text-fg-3">{note}</p>
        </div>
        <div className="min-w-0 flex-1">
          <RowSpark sym={sym} ref0={u.prev} width={80} />
        </div>
        <div className="w-[76px] text-right leading-tight">
          <p className="num text-body text-fg">
            <Tick v={px}>{fmtP(px)}</Tick>
          </p>
          <p className={cx('num text-cap', signTone(chg))}>{pct(chg)}</p>
        </div>
      </button>
    </li>
  );
}

export function Watchlist({ className }) {
  const positions = useSim((st) => st.sim.positions);
  const held = positions.map((p) => [p.sym, `held · ${p.strategy}`]);
  const list = [...held, ...WATCH.filter(([s]) => !positions.some((p) => p.sym === s))].slice(0, 7);
  return (
    <Panel className={className} title="Watchlist" meta="Held names, then the agent's candidates" body="pb-2" headerClass="pb-2">
      <ul className="divide-y divide-hair border-t border-hair">
        {list.map(([sym, note]) => (
          <WatchRow key={sym} sym={sym} note={note} held={positions.some((p) => p.sym === sym)} />
        ))}
      </ul>
    </Panel>
  );
}

const ORDER_TONE = { open: 'neutral', filled: 'green', cancelled: 'neutral' };

export function OrdersList({ className }) {
  const orders = useSim((st) => st.sim.orders);
  const openDrawer = useUI((s) => s.openDrawer);
  const list = [...orders].reverse().slice(0, 5);
  return (
    <Panel className={className} title="Working orders" meta="SL-M and target legs" actions={<Chip>{orders.filter((o) => o.status === 'open').length} open</Chip>} body="pb-3">
      <ul className="-mx-5 divide-y divide-hair border-t border-hair">
        {list.map((o) => (
          <li key={o.id}>
            <button type="button" onClick={() => openDrawer(o.sym)} className={cx('flex w-full items-center gap-3 px-5 py-2 text-left hover:bg-white/[0.025]', o.status !== 'open' && 'opacity-60')}>
              <span className={cx('num w-11 text-cap font-medium', o.kind === 'SL-M' ? 'text-risk-text' : 'text-fg-2')}>{o.kind}</span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-body text-fg">
                  {o.sym} <span className="text-fg-3">sell {o.qty}</span>
                </span>
                <span className="num block text-cap text-fg-3">{o.id}</span>
              </span>
              <span className="num text-body text-fg-2">₹{fmtP(o.price)}</span>
              <Chip tone={ORDER_TONE[o.status]} dot={o.status === 'open'}>
                {o.status === 'open' ? 'working' : o.status}
              </Chip>
            </button>
          </li>
        ))}
        {!list.length && <li className="px-5 py-6 text-center text-cap text-fg-3">No orders yet today</li>}
      </ul>
    </Panel>
  );
}
