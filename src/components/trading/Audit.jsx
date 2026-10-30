import { useState } from 'react';
import { useSim } from '../../store/useSim.js';
import { AUDIT_TONE } from '../../data/constants.js';
import { Card, Pill } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { hms } from '../../lib/format.js';

const FILTERS = ['All', 'VETO', 'HALT', 'LIMIT', 'BLOCK', 'GATE', 'RETRY'];

export function AuditLog({ className }) {
  const audit = useSim((st) => st.sim.audit);
  const [f, setF] = useState('All');
  const rows = audit.filter((a) => f === 'All' || a.type === f || (f === 'HALT' && a.type === 'RE-ARM'));
  return (
    <Card
      className={className}
      title="Guardrail audit log"
      icon="FileText"
      sub="Every veto, halt, retry and block, newest first"
      right={
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setF(x)}
              className={cx('rounded-md px-2 py-0.5 text-[11px] font-medium transition', f === x ? 'bg-acid text-ink' : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100')}
            >
              {x}
            </button>
          ))}
        </div>
      }
      body="pb-2"
    >
      <div className="scroll-thin max-h-[420px] overflow-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-y border-line text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2 text-left font-medium">When</th>
              <th className="px-2 py-2 text-left font-medium">Type</th>
              <th className="px-2 py-2 text-left font-medium">Rule</th>
              <th className="px-2 py-2 text-left font-medium">What happened</th>
              <th className="px-4 py-2 text-left font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className={cx('animate-fadein border-b border-line/50 align-top transition-colors hover:bg-white/[0.02]', a.day === 'Today' && 'bg-white/[0.01]')}>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-zinc-400 tnum">
                  <span className={cx(a.day === 'Today' ? 'text-zinc-200' : 'text-zinc-500')}>{a.day}</span> {hms(a.t)}
                </td>
                <td className="px-2 py-2.5">
                  <Pill tone={AUDIT_TONE[a.type] || 'zinc'} mono>
                    {a.type}
                  </Pill>
                </td>
                <td className="whitespace-nowrap px-2 py-2.5 text-xs text-zinc-300">{a.rule}</td>
                <td className="px-2 py-2.5 text-xs leading-snug text-zinc-400">{a.detail}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-500">{a.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const CODE = `# risk_engine/rules.py  ·  hard-coded, not promptable
MAX_RISK_PER_TRADE = 0.01      # of start-of-day equity
MAX_POSITION       = 0.25
MAX_OPEN_SLOTS     = 4
DAILY_LOSS_LIMIT   = 0.02
LIVE_HOSTS         = {"api.kite.trade", "api.alpaca.markets"}

def check(order, book):
    if order.host in LIVE_HOSTS:
        return veto("live endpoint blocked")
    if order.risk > MAX_RISK_PER_TRADE * book.start_equity:
        return veto("risk per trade > 1%")
    if order.value > MAX_POSITION * book.equity:
        return veto("position > 25%")
    if len(book.open) >= MAX_OPEN_SLOTS:
        return veto("no free slot")
    if book.day_pnl <= -DAILY_LOSS_LIMIT * book.start_equity:
        flatten_all(); lock()
        return veto("daily loss limit")
    return approve()`;

function highlight(line) {
  const hash = line.indexOf('#');
  const code = hash >= 0 ? line.slice(0, hash) : line;
  const comment = hash >= 0 ? line.slice(hash) : '';
  const parts = [];
  let i = 0;
  const re = /("[^"]*")|(\b\d+(?:\.\d+)?\b)|(\b(?:def|return|if|in|len)\b)|(\b[A-Z_]{4,}\b)|(\b(?:veto|approve|flatten_all|lock|check)\b)/g;
  let m;
  while ((m = re.exec(code))) {
    if (m.index > i) parts.push(<span key={i}>{code.slice(i, m.index)}</span>);
    const cls = m[1] ? 'text-amber-300' : m[2] ? 'text-acid' : m[3] ? 'text-indigo-300' : m[4] ? 'text-sky-300' : 'text-green-300';
    parts.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    );
    i = m.index + m[0].length;
  }
  if (i < code.length) parts.push(<span key={`t${i}`}>{code.slice(i)}</span>);
  if (comment) parts.push(<span key="c" className="text-zinc-500">{comment}</span>);
  return parts;
}

export function RulesCode({ className }) {
  return (
    <Card className={className} title="Rules are code, not prompts" icon="SquareTerminal" sub="The risk engine the LLM cannot talk its way past">
      <div className="scroll-thin overflow-x-auto rounded-lg border border-line bg-[#0b0b0e] p-3">
        <pre className="font-mono text-[11.5px] leading-[1.6] text-zinc-300">
          {CODE.split('\n').map((l, n) => (
            <div key={n} className="whitespace-pre">
              <span className="mr-3 inline-block w-5 select-none text-right text-zinc-700">{n + 1}</span>
              {highlight(l)}
            </div>
          ))}
        </pre>
      </div>
    </Card>
  );
}
