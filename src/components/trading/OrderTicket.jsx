// The pre-trade risk check, styled as an order ticket: line items with dotted leaders,
// six hard checks ticking through, and a verdict stamp. Rules run in code, not in the prompt.
import { AnimatePresence, motion } from 'framer-motion';
import { useSim } from '../../store/useSim.js';
import { checkState } from '../../sim/selectors.js';
import { Empty, Ic, Ledger, Panel, Spinner } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { fmtP, hms, inr, pct } from '../../lib/format.js';

const VERDICT = {
  pending: { text: 'Checking', c: 'text-warn-text border-warn/50' },
  approved: { text: 'Approved', c: 'text-lime border-lime/60' },
  veto: { text: 'Veto', c: 'text-risk-text border-risk/70' },
  halted: { text: 'Halted', c: 'text-risk-text border-risk/70' },
};

export function OrderTicket({ className, id, title = 'Pre-trade check' }) {
  const sim = useSim((st) => st.sim);
  const p = sim.proposal;
  if (!p) {
    return (
      <Panel id={id} className={className} title={title} meta="Every order passes six hard checks first">
        <Empty icon="Receipt" title="No order proposed yet">
          The planner proposes; the risk engine approves or vetoes.
        </Empty>
      </Panel>
    );
  }
  const v = VERDICT[p.verdict] || VERDICT.pending;
  const over = p.sizePct > 0.25;
  const veto = p.verdict === 'veto';
  const ticketNo = p.sym === 'INFY' ? 'NX-24817' : p.requested ? 'NX-24821' : 'NX-24822';
  return (
    <Panel id={id} className={className} title={title} meta={p.requested ? 'As requested by the planner' : 'As sized by code'} tone={veto ? 'risk' : undefined} body="px-4 pb-4">
      <div className={cx('receipt relative flex flex-1 flex-col bg-[#15181D] px-4 py-4', veto && 'bg-[#1A1316]')}>
        <div className="flex items-baseline justify-between gap-2 border-b border-dashed border-white/[0.12] pb-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-3">Order ticket</p>
            <p className="text-h2 text-fg">
              {p.side} {p.qty} {p.sym}
            </p>
          </div>
          <span className="num text-cap text-fg-3">{ticketNo}</span>
        </div>
        <div className="space-y-1 py-2.5 text-body">
          <Ledger k="Strategy" v={p.strategy} mono={false} />
          <Ledger k="Entry" v={`₹${fmtP(p.entry)}`} />
          <Ledger k="Stop · 2×ATR" v={`₹${fmtP(p.stop)}`} tone="text-risk-text" />
          <Ledger k="Target · 2R" v={`₹${fmtP(p.target)}`} tone="text-fg" />
          <Ledger k="Value" v={inr(p.value)} sub={pct(p.sizePct, 1, false)} tone={over ? 'text-risk-text' : 'text-fg'} />
          <Ledger k="Risk" v={inr(p.riskRs)} sub={pct(p.riskPct, 2, false)} tone={p.riskPct > 0.0101 ? 'text-risk-text' : 'text-fg'} />
        </div>
        <div className="mb-2">
          <div className="relative h-1 rounded-full bg-white/[0.08]">
            <div className={cx('h-full rounded-full transition-[width] duration-500', over ? 'bg-risk' : 'bg-fg-2')} style={{ width: `${Math.min(1, p.sizePct / 0.4) * 100}%` }} />
            <span className="absolute -top-1.5 h-4 w-px bg-fg" style={{ left: `${(0.25 / 0.4) * 100}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-cap text-fg-3">
            <span>size vs 25% cap</span>
            <span className="num">25%</span>
          </div>
        </div>
        <p className="num mb-2 rounded border border-white/[0.06] bg-black/20 px-2 py-1 text-cap text-fg-2">{p.formula}</p>
        <ul className="space-y-1 border-t border-dashed border-white/[0.12] pt-2.5">
          {p.checks.map((c) => {
            const s = checkState(c, sim.rt);
            return (
              <li key={c.k} className="flex items-center gap-2 text-cap">
                <span
                  className={cx(
                    'grid h-4 w-4 shrink-0 place-items-center rounded-full border',
                    s === 'ok' && 'border-broker/60 text-broker-text',
                    s === 'fail' && 'border-risk bg-risk text-white',
                    s === 'pending' && 'border-white/10',
                  )}
                >
                  {s === 'pending' ? <Spinner className="h-2.5 w-2.5" /> : <Ic n={s === 'ok' ? 'Check' : 'X'} size={10} sw={3} />}
                </span>
                <span className={cx('flex-1', s === 'fail' ? 'text-risk-text' : 'text-fg-2')}>{c.k}</span>
                <span className={cx('num', s === 'fail' ? 'text-risk-text' : 'text-fg-3')}>{s === 'pending' ? '···' : c.v}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="text-cap text-fg-3">
            Rules run in Python.
            <br />
            The LLM can ask; it cannot override.
          </p>
          <AnimatePresence mode="wait">
            <motion.span
              key={p.verdict + p.qty}
              initial={{ scale: 1.5, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: -8, transition: { type: 'spring', stiffness: 420, damping: 18 } }}
              exit={{ opacity: 0 }}
              className={cx('rounded-md border-2 px-2 py-0.5 text-cap font-bold uppercase tracking-[0.16em]', v.c)}
            >
              {v.text}
            </motion.span>
          </AnimatePresence>
        </div>
        <p className="num mt-2 text-center text-[10px] text-fg-mute">{hms(sim.t)} IST · NSE · EQ · CNC · paper</p>
      </div>
    </Panel>
  );
}

export const PreTradeCheck = OrderTicket;
