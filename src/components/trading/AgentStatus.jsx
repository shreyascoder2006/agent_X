import { Link } from 'react-router-dom';
import { useSim, useDerived } from '../../store/useSim.js';
import { NODES, NODE_INFO, REGIMES } from '../../data/constants.js';
import { Chip, Dot, Ic, Panel } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { hm } from '../../lib/format.js';

const NODE_TONE = { llm: 'bg-agent-text', veto: 'bg-fg', code: 'bg-fg-3' };

function lastLine(feed) {
  for (let i = feed.length - 1; i >= 0; i--) {
    const it = feed[i];
    if (it.kind === 'tool') return { who: it.tool, text: it.status === 'pending' ? 'running…' : it.text, llm: false };
    if (it.kind === 'planner') return { who: 'planner', text: it.status === 'thinking' ? 'thinking…' : it.text, llm: true };
    if (it.kind !== 'system') return { who: it.kind, text: it.text, llm: false };
  }
  return null;
}

/** Live node, loop progress and the latest thing the agent did. */
export function AgentStatus({ className, id }) {
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  const idx = NODES.indexOf(sim.node);
  const info = NODE_INFO[sim.node];
  const line = lastLine(sim.feed);
  return (
    <Panel
      id={id}
      className={className}
      title="Agent"
      meta={sim.halted ? 'Halted · awaiting re-arm' : `Loop ${d.loop} of 25 · next ${hm(d.nextLoop)}`}
      actions={
        <Link to="/activity" className="inline-flex items-center gap-1 text-cap text-fg-3 transition hover:text-fg">
          Trace <Ic n="ArrowUpRight" size={12} />
        </Link>
      }
      body="px-5 pb-4"
    >
      <div className="flex items-center gap-2">
        <Dot tone={sim.halted ? 'rose' : 'lime'} pulse={!sim.halted} />
        <span className="num text-body font-semibold text-fg">{sim.node}</span>
        <span className="truncate text-cap text-fg-3">{info?.desc}</span>
      </div>
      <ol className="mt-2.5 flex gap-1" aria-label="LangGraph nodes">
        {NODES.map((n, i) => (
          <li key={n} title={`${n} · ${NODE_INFO[n].desc}`} className="flex-1">
            <span
              className={cx(
                'block h-1 rounded-full transition-colors duration-300',
                i === idx ? (sim.halted ? 'bg-risk' : 'bg-lime') : i < idx ? NODE_TONE[NODE_INFO[n].kind] : 'bg-white/[0.08]',
                i < idx && 'opacity-60',
              )}
            />
          </li>
        ))}
      </ol>
      <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/[0.04]">
        <div className="h-full bg-fg-3 transition-[width] duration-500" style={{ width: `${d.loopProgress * 100}%` }} />
      </div>
      {line && (
        <p className="mt-2.5 line-clamp-2 text-cap text-fg-2">
          <span className={cx('num mr-1.5', line.llm ? 'text-agent-text' : 'text-fg-3')}>{line.who}</span>
          {line.text}
        </p>
      )}
    </Panel>
  );
}

const SEGS = [
  ['RANGE', 'Range', '#818CF8'],
  ['TREND', 'Trend', '#ECEEF1'],
  ['VOLATILE', 'Volatile', '#F59E0B'],
];

export function RegimePanel({ className }) {
  const g = useSim((st) => st.sim.regime);
  const d = useDerived();
  const meta = REGIMES[g.label] || REGIMES['PRE-OPEN'];
  return (
    <Panel className={className} title="Market regime" meta={meta.play} actions={<Chip tone={g.label === 'VOLATILE' ? 'amber' : 'neutral'}>{g.label}</Chip>} body="px-5 pb-4">
      <div className="grid grid-cols-3 gap-1">
        {SEGS.map(([k, label, c]) => {
          const on = g.label === k;
          return (
            <div key={k} className="text-center">
              <div className="h-1 rounded-full transition-all duration-500" style={{ background: on ? c : 'rgba(255,255,255,0.08)' }} />
              <p className={cx('mt-1.5 text-cap', on ? 'font-medium text-fg' : 'text-fg-3')}>{label}</p>
            </div>
          );
        })}
      </div>
      <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-hair pt-3">
        {[
          ['ADX', g.adx ? g.adx.toFixed(1) : '—'],
          ['India VIX', g.vix.toFixed(1)],
          ['Breadth', `${d.adv}/${d.dec}`],
          ['Conf.', g.conf ? g.conf.toFixed(2) : '—'],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-cap text-fg-3">{k}</dt>
            <dd className={cx('num text-body', k === 'India VIX' && g.vix > 16 ? 'text-warn-text' : 'text-fg')}>{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
