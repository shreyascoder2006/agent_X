import { useState } from 'react';
import { useSim } from '../store/useSim.js';
import { NODES, NODE_INFO, STAGES, STAGE_BY_ID, TOOL_META } from '../data/constants.js';
import { Card, Ic, Pill } from '../components/ui/primitives.jsx';
import { ToolChip } from '../components/trading/Agent.jsx';
import PipelineScene, { stageStatus } from '../components/three/PipelineScene.jsx';
import { cx } from '../lib/cx.js';
import { hm, hms } from '../lib/format.js';

const STATUS = {
  ok: { tone: 'green', text: 'healthy' },
  busy: { tone: 'acid', text: 'working now' },
  halted: { tone: 'rose', text: 'halted' },
};

function StageDetail({ id }) {
  const sim = useSim((st) => st.sim);
  const stage = STAGE_BY_ID[id];
  const status = STATUS[stageStatus(sim, id)];
  const calls = stage.tools.reduce((a, t) => a + sim.toolStats[t].calls, 0);
  const ms = stage.tools.reduce((a, t) => a + sim.toolStats[t].ms, 0);
  const last = Math.max(0, ...stage.tools.map((t) => sim.toolStats[t].last || 0));
  return (
    <div className="animate-fadein">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl ring-1 ring-white/10" style={{ background: `${stage.color}22`, color: stage.color }}>
          <Ic n={stage.icon} size={20} />
        </span>
        <div>
          <p className="text-lg font-semibold tracking-tight text-zinc-50">{stage.name}</p>
          <Pill tone={status.tone} dot pulse>
            {status.text}
          </Pill>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">{stage.what}</p>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['calls today', calls],
          ['avg latency', calls ? `${Math.round(ms / calls)} ms` : '—'],
          ['last call', last ? hm(last) : '—'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-panel py-2">
            <dd className="font-mono text-sm font-semibold text-zinc-100 tnum">{v}</dd>
            <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</dt>
          </div>
        ))}
      </dl>
      <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Powered by</p>
      <ul className="space-y-1.5">
        {stage.powered.map((p) => (
          <li key={p} className="flex items-center gap-2 text-sm text-zinc-300">
            <Ic n="CircleDot" size={13} className="text-acid" />
            {p}
          </li>
        ))}
      </ul>
      <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Tools at this stage</p>
      <ul className="space-y-1.5">
        {stage.tools.map((t) => (
          <li key={t} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-panel px-2.5 py-2">
            <ToolChip name={t} />
            <span className="text-[11px] text-zinc-500">→ {TOOL_META[t].returns}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Overview({ onSelect }) {
  const sim = useSim((st) => st.sim);
  return (
    <div>
      <p className="text-sm leading-relaxed text-zinc-300">
        Five stages, one direction of flow. The planner reasons; hard-coded rules decide what reaches the broker. Click a stage in the scene or below.
      </p>
      <ul className="mt-4 space-y-1.5">
        {STAGES.map((st, i) => {
          const s = STATUS[stageStatus(sim, st.id)];
          return (
            <li key={st.id}>
              <button
                type="button"
                onClick={() => onSelect(st.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2 text-left transition hover:border-zinc-500"
              >
                <span className="font-mono text-[11px] text-zinc-500">{i + 1}</span>
                <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${st.color}22`, color: st.color }}>
                  <Ic n={st.icon} size={14} />
                </span>
                <span className="flex-1 text-sm font-medium text-zinc-200">{st.name}</span>
                <Pill tone={s.tone} dot>
                  {s.text}
                </Pill>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Design rules</p>
      <ul className="space-y-2">
        {[
          ['ShieldCheck', 'The LLM proposes. Code decides what reaches the broker.'],
          ['Lock', 'Only the risk engine holds broker keys, and only paper ones.'],
          ['NotebookPen', 'Every order, veto and halt lands in the journal and the audit log.'],
        ].map(([icon, t]) => (
          <li key={t} className="flex items-start gap-2.5 text-[13px] leading-snug text-zinc-300">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-acid/10 text-acid">
              <Ic n={icon} size={12} />
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Architecture() {
  const [selected, setSelected] = useState(null);
  const sim = useSim((st) => st.sim);
  const trace = sim.feed.filter((f) => f.kind === 'tool').slice(-7).reverse();
  const idx = NODES.indexOf(sim.node);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-12">
        <Card
          className="xl:col-span-8"
          title="Agent pipeline · live"
          icon="Network"
          sub="Ingest → Reason → Risk engine → Paper broker → Journal"
          right={<Pill tone="indigo" icon="Orbit">3D · interactive</Pill>}
          body="px-3 pb-3"
        >
          <PipelineScene selected={selected} onSelect={setSelected} height={480} />
        </Card>
        <Card
          className="xl:col-span-4"
          title={selected ? 'Stage detail' : 'Pipeline overview'}
          icon={selected ? 'Crosshair' : 'Workflow'}
          right={
            selected && (
              <button type="button" onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-100">
                <Ic n="X" size={12} /> close
              </button>
            )
          }
        >
          {selected ? <StageDetail id={selected} /> : <Overview onSelect={setSelected} />}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8" title="LangGraph state machine" icon="GitBranch" sub="Indigo nodes call Claude; grey nodes are code; the lime node can veto anything">
          <div className="relative">
            <div className="absolute inset-x-6 top-[22px] hidden h-px bg-gradient-to-r from-indigo-400/40 via-acid/50 to-green-500/40 md:block" />
            <ol className="relative grid grid-cols-3 gap-2 md:grid-cols-9">
              {NODES.map((n, i) => {
                const info = NODE_INFO[n];
                const active = i === idx;
                const done = i < idx;
                return (
                  <li key={n} title={info.desc} className="flex flex-col items-center text-center">
                    <span
                      className={cx(
                        'relative z-10 grid h-11 w-11 place-items-center rounded-xl border font-mono text-[10px] font-semibold transition-all duration-300',
                        info.kind === 'llm' && 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200',
                        info.kind === 'veto' && 'border-acid/60 bg-acid/15 text-acid',
                        info.kind === 'code' && 'border-line2 bg-panel text-zinc-300',
                        done && 'opacity-80',
                        active && (sim.halted ? 'scale-110 border-rose-400 shadow-glowrose' : 'scale-110 shadow-glow'),
                      )}
                    >
                      {done ? <Ic n="Check" size={14} sw={2.6} /> : i + 1}
                    </span>
                    <span className={cx('mt-1.5 font-mono text-[10px] font-semibold', active ? 'text-acid' : 'text-zinc-300')}>{n}</span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-600">{info.kind === 'llm' ? 'Claude' : info.kind === 'veto' ? 'veto' : 'code'}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="mt-3 rounded-lg border border-line bg-panel px-3 py-2 text-xs text-zinc-400">
            <span className="font-mono text-acid">{sim.node}</span> · {NODE_INFO[sim.node]?.desc}
          </p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            {[
              ['Planning', 'LangGraph state machine. Re-plans on a stop hit, a news shock, a regime flip or a tool error.'],
              ['Memory · within a task', "LangGraph state in Redis: open positions, today's P&L against the limit, orders sent, current node."],
              ['Memory · across tasks', 'Postgres ledger plus Qdrant: every journal entry is embedded; the 3 most similar past setups go to the planner.'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-line bg-panel px-3 py-2.5">
                <p className="font-semibold text-zinc-200">{k}</p>
                <p className="mt-1 leading-snug text-zinc-500">{v}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-4" title="Live trace" icon="Radio" sub="Latest tool calls flowing through the pipeline">
          <ol className="space-y-1.5">
            {trace.map((f) => (
              <li key={f.id} className="animate-fadein rounded-lg border border-line bg-panel px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <ToolChip name={f.tool} />
                  <span className="font-mono text-[10px] text-zinc-500 tnum">{hms(f.t)}</span>
                </div>
                <p className={cx('mt-1 truncate text-[11px]', f.status === 'veto' || f.status === 'blocked' ? 'text-rose-300' : f.status === 'pending' ? 'text-amber-300' : 'text-zinc-400')} title={f.text}>
                  {f.status === 'pending' ? 'running…' : f.text}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            {[
              ['LLM', 'Claude Sonnet 5.5 · Haiku 5.5'],
              ['Framework', 'LangGraph · vectorbt'],
              ['Vector DB', 'Qdrant'],
              ['Hosting', 'Cloud Run · Mumbai'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-line bg-panel px-2.5 py-2">
                <p className="text-zinc-500">{k}</p>
                <p className="font-medium text-zinc-200">{v}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
