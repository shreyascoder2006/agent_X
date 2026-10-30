// Instrument drill-down: candles with entry/stop/target, a depth ladder around the sim price,
// the agent's reasoning, news, risk math and the order legs. Opens from any symbol.
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSim } from '../../store/useSim.js';
import { useUI } from '../../store/useUI.js';
import { UNI } from '../../data/universe.js';
import { NEWS_POOL } from '../../data/history.js';
import { STRATEGIES } from '../../data/constants.js';
import { START } from '../../sim/index.js';
import { PriceChart } from '../charts/PriceChart.jsx';
import { Chip, Ic, Ledger, Monogram, Rolling, Tick, signTone } from '../ui/primitives.jsx';
import { charges, ladder, legMs } from '../../lib/instrument.js';
import { cx } from '../../lib/cx.js';
import { fmtP, hms, inr, num, pct, rStr } from '../../lib/format.js';

const ms3 = (seed) => String(Math.abs(String(seed).split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 1000).padStart(3, '0');
export const stamp = (t, seed) => `${hms(t)}.${ms3(seed)}`;

function Section({ title, meta, children, className }) {
  return (
    <section className={cx('border-t border-hair px-5 py-4', className)}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-h2 text-fg">{title}</h3>
        {meta && <span className="text-cap text-fg-3">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function Depth({ sym, p, seed }) {
  const L = ladder(sym, p, seed);
  const max = Math.max(...L.bids.map((x) => x.qty), ...L.asks.map((x) => x.qty));
  const tb = L.bids.reduce((a, x) => a + x.qty, 0);
  const ta = L.asks.reduce((a, x) => a + x.qty, 0);
  const row = (x, side) => (
    <div key={`${side}${x.px}`} className="relative flex h-6 items-center justify-between px-2 text-cap">
      <span className={cx('absolute inset-y-0.5 rounded-sm', side === 'bid' ? 'right-0 bg-broker/[0.14]' : 'left-0 bg-risk/[0.12]')} style={{ width: `${(x.qty / max) * 100}%` }} />
      {side === 'bid' ? (
        <>
          <span className="num relative text-fg-3">{x.orders}</span>
          <span className="num relative text-fg-2">{num(x.qty)}</span>
          <span className="num relative text-broker-text">{fmtP(x.px)}</span>
        </>
      ) : (
        <>
          <span className="num relative text-risk-text">{fmtP(x.px)}</span>
          <span className="num relative text-fg-2">{num(x.qty)}</span>
          <span className="num relative text-fg-3">{x.orders}</span>
        </>
      )}
    </div>
  );
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 px-2 pb-1 text-cap text-fg-3">
        <div className="flex justify-between">
          <span>Orders</span>
          <span>Qty</span>
          <span>Bid</span>
        </div>
        <div className="flex justify-between">
          <span>Offer</span>
          <span>Qty</span>
          <span>Orders</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>{L.bids.map((x) => row(x, 'bid'))}</div>
        <div>{L.asks.map((x) => row(x, 'ask'))}</div>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-2 border-t border-hair px-2 pt-2 text-cap">
        <span className="flex justify-between text-fg-3">
          Total <span className="num text-fg-2">{num(tb)}</span>
        </span>
        <span className="flex justify-between text-fg-3">
          <span className="num text-fg-2">{num(ta)}</span> spread <span className="num">₹{fmtP(L.spread)}</span>
        </span>
      </div>
    </div>
  );
}

function RiskMath({ trade, px, sym }) {
  if (!trade) {
    const u = UNI[sym];
    const atr2 = px * (0.012 + 0.006 * (u?.beta || 1));
    const qty = Math.min(Math.floor(10000 / atr2), Math.floor((0.25 * START) / px));
    return (
      <div className="space-y-1.5">
        <p className="mb-2 text-cap text-fg-3">Not held. Sizing preview from the 1% rule, not an order.</p>
        <Ledger k="Stop distance · 2×ATR" v={`₹${fmtP(atr2)}`} />
        <Ledger k="Risk budget · 1%" v="₹10,000" />
        <Ledger k="Quantity" v={`${qty} sh`} sub={qty * px > 0.25 * START - 1 ? '25% cap' : ''} />
        <Ledger k="Position value" v={inr(qty * px)} sub={pct((qty * px) / START, 1, false)} />
      </div>
    );
  }
  const rps = trade.entry - trade.stop;
  const R = (px - trade.entry) / rps;
  const open = trade.exit == null;
  return (
    <div className="space-y-1.5">
      <Ledger k="Quantity" v={`${trade.qty} sh`} />
      <Ledger k="Risk per share" v={`₹${fmtP(rps)}`} />
      <Ledger k="Planned risk" v={inr(rps * trade.qty)} sub={pct((rps * trade.qty) / START, 2, false)} />
      <Ledger k="Reward : risk" v={`${((trade.target - trade.entry) / rps).toFixed(2)} : 1`} />
      {open ? (
        <>
          <Ledger k="Now" v={rStr(R)} tone={signTone(R)} />
          <Ledger k="To stop" v={pct(trade.stop / px - 1)} tone="text-risk-text" />
          <Ledger k="To target" v={pct(trade.target / px - 1)} tone="text-lime" />
          <Ledger k="Value" v={inr(px * trade.qty)} sub={pct((px * trade.qty) / START, 1, false)} />
        </>
      ) : (
        <>
          <Ledger k="Exit" v={`₹${fmtP(trade.exit)}`} sub={trade.reason} />
          <Ledger k="Result" v={`${inr(trade.pnl, 2, true)} · ${rStr(trade.R)}`} tone={signTone(trade.pnl)} />
        </>
      )}
    </div>
  );
}

const LEG = { open: ['neutral', 'working'], filled: ['green', 'filled'], cancelled: ['neutral', 'cancelled'] };

function Legs({ trade, orders, journal }) {
  if (!trade) return <p className="text-body text-fg-3">No orders on this symbol today.</p>;
  const buy = charges('BUY', trade.qty, trade.entry);
  const sl = orders.find((o) => o.kind === 'SL-M');
  const tp = orders.find((o) => o.kind === 'LMT');
  const items = [
    {
      t: trade.openedAt,
      seed: trade.oid,
      icon: 'Send',
      tone: 'green',
      title: `BUY ${trade.qty} @ MKT · filled ₹${fmtP(trade.entry)}`,
      meta: `${trade.oid} · NSE · EQ · CNC · ${legMs(trade.oid)} ms`,
      sub: `brokerage ₹${fmtP(buy.brokerage)} · STT ₹${fmtP(buy.stt)} · exch ₹${fmtP(buy.exch)} · GST ₹${fmtP(buy.gst)} · stamp ₹${fmtP(buy.stamp)}`,
    },
    sl && { t: sl.at, seed: sl.id, icon: 'ShieldAlert', tone: LEG[sl.status][0], title: `SL-M SELL ${sl.qty} @ ₹${fmtP(sl.price)}`, meta: `${sl.id} · ${LEG[sl.status][1]}` },
    tp && {
      t: tp.at,
      seed: tp.id,
      icon: 'Target',
      tone: LEG[tp.status][0],
      title: `LMT SELL ${tp.qty} @ ₹${fmtP(tp.price)}`,
      meta: `${tp.id} · ${LEG[tp.status][1]}${journal?.targetWas ? ` · modified from ₹${fmtP(journal.targetWas)}` : ''}`,
    },
  ].filter(Boolean);
  if (trade.exit != null) {
    const sell = charges('SELL', trade.qty, trade.exit);
    items.push({
      t: trade.closedAt,
      seed: `${trade.oid}x`,
      icon: trade.reason === 'kill' ? 'OctagonX' : 'CircleCheck',
      tone: trade.pnl >= 0 ? 'green' : 'rose',
      title: `SELL ${trade.qty} filled ₹${fmtP(trade.exit)} · ${trade.reason === 'kill' ? 'kill switch flatten' : trade.reason}`,
      meta: `${inr(trade.pnl, 2, true)} · ${rStr(trade.R)}`,
      sub: `brokerage ₹${fmtP(sell.brokerage)} · STT ₹${fmtP(sell.stt)} · exch ₹${fmtP(sell.exch)} · GST ₹${fmtP(sell.gst)}`,
    });
  }
  return (
    <ol className="relative space-y-3 pl-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-hair">
      {items.map((it) => (
        <li key={it.seed} className="relative">
          <span className={cx('absolute -left-5 top-0.5 grid h-[15px] w-[15px] place-items-center rounded-full border bg-overlay', it.tone === 'rose' ? 'border-risk/50 text-risk-text' : it.tone === 'green' ? 'border-broker/50 text-broker-text' : 'border-line text-fg-3')}>
            <Ic n={it.icon} size={9} sw={2.4} />
          </span>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-body text-fg">{it.title}</p>
            <span className="num shrink-0 text-cap text-fg-3">{stamp(it.t, it.seed)}</span>
          </div>
          <p className="num text-cap text-fg-3">{it.meta}</p>
          {it.sub && <p className="num mt-0.5 text-cap text-fg-3/80">{it.sub}</p>}
        </li>
      ))}
    </ol>
  );
}

function Body({ sym }) {
  const sim = useSim((st) => st.sim);
  const u = UNI[sym];
  const px = sim.universe[sym].p;
  const chg = px / u.prev - 1;
  const pos = sim.positions.find((p) => p.sym === sym);
  const closed = [...sim.closed].reverse().find((c) => c.sym === sym);
  const trade = pos || closed || null;
  const orders = sim.orders.filter((o) => o.sym === sym);
  const journal = sim.journal.find((j) => j.sym === sym && j.day === 'Today') || sim.journal.find((j) => j.sym === sym);
  const news = [
    ...sim.news.filter((n) => n.sym === sym || (n.sym === 'IT' && u.sector === 'IT')),
    ...NEWS_POOL.filter((n) => n.sym === sym && !sim.news.some((m) => m.head === n.head)),
  ].slice(0, 4);
  const markers = [];
  if (trade) markers.push({ kind: 'BUY', t: trade.openedAt, text: `BUY ${trade.qty}` });
  if (closed) markers.push({ kind: closed.reason === 'kill' ? 'KILL' : closed.reason === 'target' ? 'TARGET' : 'STOP', t: closed.closedAt, text: closed.reason === 'kill' ? 'KILL' : closed.reason.toUpperCase() });

  return (
    <>
      <div className="flex items-start gap-3 pb-4 pl-5 pr-14 pt-5">
        <Monogram sym={sym} size={40} tone={pos ? 'held' : undefined} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-h1 text-fg">{sym}</h2>
            {pos && <Chip tone="lime" dot>Held · {pos.qty} sh</Chip>}
            {!pos && closed && <Chip tone={closed.pnl >= 0 ? 'green' : 'rose'}>Closed today</Chip>}
          </div>
          <p className="text-cap text-fg-3">
            {u.sector} · NSE · EQ · CNC · beta {u.beta.toFixed(1)}
          </p>
        </div>
        <div className="text-right">
          <Rolling text={`₹${fmtP(px)}`} className="text-[22px] font-semibold leading-7 text-fg" />
          <p className={cx('num text-body', signTone(chg))}>
            {chg >= 0 ? '+' : '−'}₹{fmtP(Math.abs(px - u.prev))} · {pct(chg)}
          </p>
        </div>
      </div>
      <div className="px-2">
        <PriceChart sym={sym} height={260} levels={trade ? { entry: trade.entry, stop: trade.stop, target: trade.target } : null} markers={markers} />
      </div>

      <div className="grid gap-0 sm:grid-cols-2">
        <Section title="Market depth" meta="5 levels · paper book">
          <Depth sym={sym} p={px} seed={Math.floor(sim.rt * 2)} />
        </Section>
        <Section title="Risk math" meta={trade ? `${trade.strategy} · ${STRATEGIES[trade.strategy]?.rule || ''}` : '1% rule'} className="sm:border-l">
          <RiskMath trade={trade && (pos ? { ...pos, exit: null } : closed)} px={px} sym={sym} />
        </Section>
      </div>

      {journal && (
        <Section title="Why the agent traded" meta={`${journal.id} · ${journal.day} · written by Claude Sonnet 5.5`}>
          <blockquote className="border-l-2 border-agent/60 pl-4 text-[14px] leading-[22px] text-fg">{journal.prose}</blockquote>
        </Section>
      )}

      <Section title="News" meta="triaged by Claude Haiku 5.5 · score −1 to +1">
        {news.length ? (
          <ul className="flex flex-wrap gap-2">
            {news.map((n) => (
              <li key={n.head} className="flex max-w-full items-center gap-2 rounded-lg border border-hair bg-white/[0.02] px-2.5 py-1.5">
                <span className={cx('num text-cap font-semibold', n.score >= 0 ? 'text-lime' : 'text-risk-text')}>
                  {n.score >= 0 ? '+' : '−'}
                  {Math.abs(n.score).toFixed(2)}
                </span>
                <span className="truncate text-cap text-fg-2">{n.head}</span>
                <span className="shrink-0 text-cap text-fg-3">{n.src}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-fg-3">No headlines for {sym} today.</p>
        )}
      </Section>

      <Section title="Order legs" meta="bracket · paper broker">
        <Legs trade={trade && (pos ? { ...pos } : closed)} orders={orders} journal={journal} />
      </Section>
      <p className="px-5 pb-6 pt-1 text-cap text-fg-3">
        Depth, volume and charges are illustrative. Charges are shown per fill and are not deducted from the paper P&amp;L. <Tick v={px}>Last ₹{fmtP(px)}</Tick>
      </p>
    </>
  );
}

export function InstrumentDrawer() {
  const sym = useUI((s) => s.drawer);
  const close = useUI((s) => s.closeDrawer);
  useEffect(() => {
    if (!sym) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sym, close]);
  return (
    <AnimatePresence>
      {sym && UNI[sym] && (
        <motion.div className="fixed inset-0 z-[55]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 0.1 } }}>
          <button type="button" aria-label="Close instrument" className="absolute inset-0 bg-bg/45" onClick={close} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`${sym} instrument`}
            initial={{ x: '100%' }}
            animate={{ x: 0, transition: { type: 'spring', stiffness: 340, damping: 36 } }}
            exit={{ x: '100%', transition: { type: 'spring', stiffness: 420, damping: 40 } }}
            className="scroll-thin absolute inset-y-0 right-0 w-[600px] max-w-full overflow-y-auto border-l border-line bg-overlay/90 shadow-pop backdrop-blur-2xl"
          >
            <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-fg-3 hover:bg-white/[0.06] hover:text-fg">
              <Ic n="X" size={16} />
            </button>
            <Body key={sym} sym={sym} />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
