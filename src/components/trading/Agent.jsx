// Panels about what the agent is doing: regime, pre-trade checks, the activity feed.
import { Link } from 'react-router-dom';
import { useSim, useDerived } from '../../store/useSim.js';
import { NODES, NODE_INFO, REGIMES, STRATEGIES, TOOL_META, TOOLS } from '../../data/constants.js';
import { checkState } from '../../sim/selectors.js';
import { Bar, Card, Ic, Pill, Ring, Spinner, TONE, TypeOut, Tip } from '../ui/primitives.jsx';
import { useTween } from '../../hooks/useTween.js';
import { cx } from '../../lib/cx.js';
import { fmtP, hm, hms, inr, num, pct } from '../../lib/format.js';

/* ── Regime ─────────────────────────────────────────────────────────── */

function RegimeDial({ label }) {
  const pos = { RANGE: 1 / 6, TREND: 0.5, VOLATILE: 5 / 6 }[label] ?? 0.04;
  const f = useTween(pos, 900);
  const W = 220;
  const H = 122;
  const cx0 = W / 2;
  const cy0 = H - 8;
  const r = 92;
  const A = (x) => Math.PI + Math.PI * x;
  const P = (a, rr = r) => [cx0 + rr * Math.cos(a), cy0 + rr * Math.sin(a)];
  const seg = (a, b) => {
    const [x0, y0] = P(A(a));
    const [x1, y1] = P(A(b));
    return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const [nx, ny] = P(A(f), r - 22);
  const segs = [
    { a: 0.005, b: 0.325, c: '#818CF8', k: 'RANGE' },
    { a: 0.34, b: 0.66, c: '#C6FF00', k: 'TREND' },
    { a: 0.675, b: 0.995, c: '#F59E0B', k: 'VOLATILE' },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[240px]" aria-hidden="true">
      {segs.map((s) => (
        <path key={s.k} d={seg(s.a, s.b)} stroke={s.c} strokeOpacity={label === s.k ? 1 : 0.22} strokeWidth="12" fill="none" style={{ transition: 'stroke-opacity .5s' }} />
      ))}
      <line x1={cx0} y1={cy0} x2={nx} y2={ny} stroke="#E4E4E7" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx0} cy={cy0} r="6" fill="#09090B" stroke="#E4E4E7" strokeWidth="2.5" />
    </svg>
  );
}

export function RegimeCard({ className }) {
  const sim = useSim((st) => st.sim);
  const d = useDerived();
  const g = sim.regime;
  const meta = REGIMES[g.label] || REGIMES['PRE-OPEN'];
  return (
    <Card className={className} title="Market regime" icon="Gauge" right={<Pill tone={meta.tone} dot pulse={g.label !== 'PRE-OPEN'}>{g.label}</Pill>}>
      <RegimeDial label={g.label} />
      <div className="mt-1 flex justify-between px-3 text-[10px] uppercase tracking-wider text-zinc-600">
        <span>Range</span>
        <span>Trend</span>
        <span>Volatile</span>
      </div>
      <div className="mt-1 text-center">
        <p className="text-xl font-semibold tracking-tight transition-colors duration-500" style={{ color: meta.color }}>
          {g.label}
        </p>
        <p className="text-[11px] text-zinc-500">{meta.play}</p>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ['NIFTY ADX', g.adx ? g.adx.toFixed(1) : '—', 'trend strength'],
          ['India VIX', g.vix.toFixed(1), g.vix > 16 ? 'above 16: sit out' : 'calm'],
          ['Breadth', `${d.adv}↑ ${d.dec}↓`, 'of 50 stocks'],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-lg border border-line bg-panel px-2 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</dt>
            <dd className="font-mono text-sm font-semibold text-zinc-100 tnum">{v}</dd>
            <dd className="truncate text-[10px] text-zinc-500">{s}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2.5">
        <Ring value={d.loopProgress} size={40} stroke={3.5} color={sim.halted ? '#F43F5E' : '#C6FF00'}>
          <Ic n="Repeat" size={13} className="text-zinc-400" />
        </Ring>
        <div className="min-w-0 flex-1 text-xs">
          <p className="font-medium text-zinc-200">
            Loop {d.loop} of 25 · every 15 min
          </p>
          <p className="text-zinc-500">
            Next scan at <span className="font-mono text-zinc-300 tnum">{hm(d.nextLoop)}</span> · confidence{' '}
            <span className="font-mono text-zinc-300 tnum">{g.conf ? g.conf.toFixed(2) : '—'}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ── Pre-trade risk check ───────────────────────────────────────────── */

const VERDICT = {
  pending: { tone: 'amber', text: 'Checking' },
  approved: { tone: 'acid', text: 'Approved' },
  veto: { tone: 'rose', text: 'Vetoed' },
  halted: { tone: 'rose', text: 'Halted' },
};

export function PreTradeCheck({ className }) {
  const sim = useSim((st) => st.sim);
  const p = sim.proposal;
  if (!p) {
    return (
      <Card className={className} title="Pre-trade risk check" icon="ShieldCheck">
        <div className="grid h-[260px] place-items-center rounded-lg border border-dashed border-line text-center text-xs text-zinc-500">
          <div>
            <Ic n="Scale" size={22} className="mx-auto mb-2 text-zinc-600" />
            No order proposed yet. Every order passes six hard checks here first.
          </div>
        </div>
      </Card>
    );
  }
  const v = VERDICT[p.verdict] || VERDICT.pending;
  const over = p.sizePct > 0.25;
  return (
    <Card
      className={className}
      title="Pre-trade risk check"
      icon="ShieldCheck"
      tone={p.verdict === 'veto' ? 'rose' : undefined}
      right={
        <Pill tone={v.tone} dot={p.verdict === 'pending'} pulse>
          {p.verdict === 'pending' && <Spinner className="mr-0.5 h-2.5 w-2.5" />}
          {v.text}
        </Pill>
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-lg font-semibold text-zinc-50">
            {p.side} {p.qty} {p.sym}
          </p>
          <p className="text-[11px] text-zinc-500">
            {p.strategy} · {p.requested ? 'as requested by the planner' : 'as sized by code'}
          </p>
        </div>
        <Pill tone={STRATEGIES[p.strategy]?.tone || 'zinc'}>{p.strategy}</Pill>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ['Entry', p.entry, 'text-zinc-100'],
          ['Stop', p.stop, 'text-rose-300'],
          ['Target', p.target, 'text-acid'],
        ].map(([k, val, c]) => (
          <div key={k} className="rounded-lg border border-line bg-panel py-1.5">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</p>
            <p className={cx('font-mono text-sm tnum', c)}>₹{fmtP(val)}</p>
          </div>
        ))}
      </div>
      <p className="mt-2.5 rounded-lg bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-zinc-400">{p.formula}</p>
      <div className="mt-2.5">
        <div className="mb-1 flex justify-between text-[11px]">
          <span className="text-zinc-500">Position size vs 25% cap</span>
          <span className={cx('font-mono tnum', over ? 'text-rose-300' : 'text-zinc-300')}>{pct(p.sizePct, 1, false)}</span>
        </div>
        <div className="relative h-2 rounded-full bg-white/[0.06]">
          <div className={cx('h-full rounded-full transition-[width] duration-500', over ? 'bg-rose-500' : 'bg-acid')} style={{ width: `${Math.min(1, p.sizePct / 0.4) * 100}%` }} />
          <span className="absolute -top-1 h-4 w-px bg-zinc-300" style={{ left: `${(0.25 / 0.4) * 100}%` }} title="25% cap" />
        </div>
      </div>
      <ul className="mt-3 space-y-1">
        {p.checks.map((c) => {
          const s = checkState(c, sim.rt);
          return (
            <li key={c.k} className="flex items-center gap-2 text-xs">
              <span
                className={cx(
                  'grid h-4 w-4 place-items-center rounded-full',
                  s === 'ok' && 'bg-acid text-ink',
                  s === 'fail' && 'bg-rose-500 text-white',
                  s === 'pending' && 'bg-white/[0.06]',
                )}
              >
                {s === 'pending' ? <Spinner className="h-2.5 w-2.5" /> : <Ic n={s === 'ok' ? 'Check' : 'X'} size={10} sw={3} />}
              </span>
              <span className={cx('flex-1', s === 'fail' ? 'text-rose-200' : 'text-zinc-300')}>{c.k}</span>
              <span className={cx('font-mono tnum', s === 'fail' ? 'text-rose-300' : 'text-zinc-500')}>{s === 'pending' ? '…' : c.v}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 border-t border-line pt-2.5 text-[11px] text-zinc-500">Rules run in Python. The LLM can ask; it cannot override.</p>
    </Card>
  );
}

/* ── Activity feed ──────────────────────────────────────────────────── */

const KIND = {
  user: { icon: 'User', chip: 'bg-zinc-700 text-zinc-100', label: 'You' },
  planner: { icon: 'Sparkles', chip: 'bg-indigo-500 text-white', label: 'Planner · Claude Sonnet 5.5' },
  decision: { icon: 'Cpu', chip: 'bg-white/[0.06] text-zinc-300 ring-1 ring-white/10', label: 'Regime detector · code' },
  risk: { icon: 'ShieldAlert', chip: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30', label: 'Risk engine' },
  monitor: { icon: 'Eye', chip: 'bg-white/[0.04] text-zinc-400 ring-1 ring-white/10', label: 'Monitor' },
  system: { icon: 'Radio', chip: 'bg-white/[0.04] text-zinc-400 ring-1 ring-white/10', label: 'System' },
  halt: { icon: 'OctagonX', chip: 'bg-rose-500 text-white', label: 'Kill switch' },
};

function StatusChip({ status, ms }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30">
        <Spinner className="h-2.5 w-2.5" /> running
      </span>
    );
  }
  const map = {
    ok: ['acid', 'CircleCheck', `ok · ${ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`}`],
    fail: ['zinc', 'CircleX', 'gate failed'],
    veto: ['rose', 'Ban', 'VETO'],
    blocked: ['rose', 'Lock', 'blocked'],
  };
  const [tone, icon, text] = map[status] || map.ok;
  return (
    <Pill tone={tone} icon={icon}>
      {text}
    </Pill>
  );
}

export function ToolChip({ name, args }) {
  const m = TOOL_META[name];
  return (
    <span className={cx('inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] ring-1 ring-inset', TONE[m?.tone || 'zinc'])}>
      <Ic n={m?.icon || 'Wrench'} size={11} />
      <span className="truncate">
        {name}({args ? <span className="opacity-70">{args}</span> : ''})
      </span>
    </span>
  );
}

export function FeedItem({ it, compact }) {
  const k = it.kind === 'tool' ? null : KIND[it.kind] || KIND.system;
  const toneText = it.tone === 'rose' ? 'text-rose-200' : it.tone === 'amber' ? 'text-amber-200' : 'text-zinc-200';

  if (compact) {
    return (
      <li className="flex animate-fadein items-start gap-2.5 py-1.5">
        <span className="mt-0.5 w-[54px] shrink-0 font-mono text-[10px] text-zinc-500 tnum">{hms(it.t)}</span>
        <span className="min-w-0 flex-1 text-xs leading-snug text-zinc-300">
          {it.kind === 'tool' ? (
            <>
              <span className="font-mono text-zinc-400">{it.tool}</span> → {it.status === 'pending' ? <span className="text-amber-300">running…</span> : it.text}
            </>
          ) : it.kind === 'planner' && it.status === 'thinking' ? (
            <span className="shimmer-text">Planner is thinking…</span>
          ) : (
            it.text
          )}
        </span>
      </li>
    );
  }

  if (it.kind === 'system' || it.kind === 'monitor') {
    return (
      <li className="group flex animate-fadein items-center gap-3 py-1.5 pl-1">
        <span className="w-[62px] shrink-0 font-mono text-[11px] text-zinc-600 tnum">{hms(it.t)}</span>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/[0.03] text-zinc-500 ring-1 ring-white/[0.06]">
          <Ic n={it.icon || (it.kind === 'monitor' ? 'Eye' : 'Radio')} size={12} />
        </span>
        <span className={cx('min-w-0 flex-1 text-xs', it.tone === 'rose' ? 'font-medium text-rose-300' : 'text-zinc-500')}>{it.text}</span>
      </li>
    );
  }

  if (it.kind === 'halt') {
    return (
      <li className="my-2 animate-fadein rounded-xl border border-rose-500/50 bg-rose-500/[0.08] p-3 shadow-glowrose">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500 text-white">
            <Ic n="OctagonX" size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-rose-100">
              HALTED <span className="ml-2 font-mono text-[11px] font-normal text-rose-300/80">{hms(it.t)} · {it.meta}</span>
            </p>
            <p className="text-sm text-rose-100/90">{it.text}</p>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex animate-fadein gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-white/[0.02]">
      <span className="w-[62px] shrink-0 pt-1 font-mono text-[11px] text-zinc-500 tnum">{hms(it.t)}</span>
      <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-lg', it.kind === 'tool' ? TONE[TOOL_META[it.tool]?.tone || 'zinc'] + ' ring-1 ring-inset' : k.chip)}>
        <Ic n={it.kind === 'tool' ? TOOL_META[it.tool]?.icon : k.icon} size={14} />
      </span>
      <div className="min-w-0 flex-1">
        {it.kind === 'tool' ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <ToolChip name={it.tool} args={it.args} />
              <StatusChip status={it.status} ms={it.ms} />
            </div>
            <p
              className={cx(
                'mt-1 text-[13px] leading-snug',
                it.status === 'pending' ? 'text-zinc-500' : it.status === 'veto' || it.status === 'blocked' ? 'text-rose-200' : it.status === 'fail' ? 'text-zinc-400' : 'text-zinc-200',
              )}
            >
              {it.status === 'pending' ? 'waiting for the tool…' : <>→ {it.text}</>}
            </p>
            {it.meta && <p className="mt-0.5 text-[11px] text-sky-300/80">↻ {it.meta}</p>}
          </>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{it.actor || k.label}</p>
            {it.kind === 'planner' && it.status === 'thinking' ? (
              <p className="mt-1 text-[13px]">
                <span className="shimmer-text font-medium">Thinking through candidates and limits…</span>
              </p>
            ) : it.kind === 'user' ? (
              <p className="mt-1 inline-block rounded-xl rounded-tl-sm bg-white/[0.06] px-3 py-2 text-[13px] text-zinc-100">
                <TypeOut text={it.text} born={it.born} cps={55} />
              </p>
            ) : (
              <p className={cx('mt-1 text-[13px] leading-snug', toneText)}>{it.kind === 'planner' ? <TypeOut text={it.text} born={it.born} cps={110} /> : it.text}</p>
            )}
            {it.status !== 'thinking' && it.chips && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {it.chips.map((c) => (
                  <Pill key={c} tone="acid" icon="Lock">
                    {c}
                  </Pill>
                ))}
              </div>
            )}
            {it.status !== 'thinking' && it.list && (
              <ol className="mt-2 space-y-1">
                {it.list.map((l, i) => (
                  <li key={l} className="flex gap-2 text-[13px] text-zinc-300">
                    <span className={cx('grid h-5 w-5 shrink-0 place-items-center rounded-md font-mono text-[10px]', it.tone === 'amber' ? 'bg-amber-500/15 text-amber-300' : 'bg-indigo-500/20 text-indigo-200')}>
                      {i + 1}
                    </span>
                    {l}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
        <p className="mt-1 hidden text-[10px] text-zinc-600 group-hover:block">
          event #{it.id} · {it.kind === 'tool' ? `${TOOL_META[it.tool]?.stage} stage · node ${TOOL_META[it.tool]?.node}` : it.kind}
        </p>
      </div>
    </li>
  );
}

export function AgentNow({ className }) {
  const feed = useSim((st) => st.sim.feed);
  const node = useSim((st) => st.sim.node);
  const items = feed.slice(-6).reverse();
  return (
    <Card
      className={className}
      title="Agent now"
      icon="Activity"
      right={
        <Link to="/activity" className="inline-flex items-center gap-1 text-[11px] text-acid hover:underline">
          Full feed <Ic n="ArrowUpRight" size={11} />
        </Link>
      }
    >
      <p className="mb-1 flex items-center gap-2 text-[11px] text-zinc-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acid" /> node <span className="font-mono text-zinc-300">{node}</span>
      </p>
      <ul className="divide-y divide-line/60">
        {items.map((it) => (
          <FeedItem key={it.id} it={it} compact />
        ))}
      </ul>
    </Card>
  );
}

/* ── Loop stepper, tool stats, models, news ─────────────────────────── */

export function LoopStepper({ className }) {
  const node = useSim((st) => st.sim.node);
  const halted = useSim((st) => st.sim.halted);
  const idx = NODES.indexOf(node);
  return (
    <Card className={className} title="Current loop · LangGraph" icon="Workflow" right={<Pill tone={halted ? 'rose' : 'acid'} dot pulse>{halted ? 'halted' : node}</Pill>}>
      <ol className="relative space-y-1">
        {NODES.map((n, i) => {
          const info = NODE_INFO[n];
          const state = i < idx ? 'done' : i === idx ? 'active' : 'todo';
          return (
            <li key={n} className={cx('flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors', state === 'active' && 'bg-acid/[0.06] ring-1 ring-acid/25')}>
              <span
                className={cx(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[10px]',
                  state === 'done' && 'bg-acid/15 text-acid',
                  state === 'active' && (halted ? 'bg-rose-500 text-white' : 'bg-acid text-ink shadow-glowsm'),
                  state === 'todo' && 'bg-white/[0.04] text-zinc-500',
                )}
              >
                {state === 'done' ? <Ic n="Check" size={11} sw={3} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cx('font-mono text-xs', state === 'todo' ? 'text-zinc-500' : 'text-zinc-100')}>{n}</p>
                <p className="truncate text-[11px] text-zinc-500">{info.desc}</p>
              </div>
              <Pill tone={info.kind === 'llm' ? 'indigo' : info.kind === 'veto' ? 'acid' : 'zinc'}>{info.kind === 'llm' ? 'LLM' : info.kind === 'veto' ? 'veto' : 'code'}</Pill>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

const BAR_COLOR = { indigo: '#818CF8', amber: '#F59E0B', sky: '#38BDF8', violet: '#A78BFA', teal: '#2DD4BF', acid: '#C6FF00', green: '#22C55E', zinc: '#A1A1AA' };

export function ToolStats({ className }) {
  const stats = useSim((st) => st.sim.toolStats);
  const max = Math.max(1, ...TOOLS.map((t) => stats[t].calls));
  const total = TOOLS.reduce((a, t) => a + stats[t].calls, 0);
  return (
    <Card className={className} title="Tool calls today" icon="Wrench" right={<span className="font-mono text-xs text-zinc-400 tnum">{total} calls</span>}>
      <ul className="space-y-2">
        {TOOLS.map((t) => {
          const s = stats[t];
          const m = TOOL_META[t];
          return (
            <li key={t}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                <Tip text={`Returns ${m.returns}. ${s.last ? `Last call ${hm(s.last)} IST.` : 'Not called yet.'}`}>
                  <span className="font-mono text-zinc-300">{t}</span>
                </Tip>
                <span className="font-mono text-zinc-500 tnum">
                  {s.calls} · {s.calls ? `${Math.round(s.ms / s.calls)} ms` : '—'}
                  {s.flags > 0 && <span className="ml-1.5 text-rose-300">{s.flags} flagged</span>}
                </span>
              </div>
              <Bar value={s.calls / max} color={BAR_COLOR[m.tone]} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function ModelUsage({ className }) {
  const models = useSim((st) => st.sim.models);
  const total = models.sonnet.tokens + models.haiku.tokens || 1;
  const rows = [
    { k: 'Claude Sonnet 5.5', role: 'planner · re-plans · journal', m: models.sonnet, c: '#6366F1' },
    { k: 'Claude Haiku 5.5', role: 'news triage', m: models.haiku, c: '#F59E0B' },
  ];
  return (
    <Card className={className} title="Models" icon="BrainCircuit">
      <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
        {rows.map((r) => (
          <div key={r.k} className="h-full transition-[width] duration-500" style={{ width: `${(r.m.tokens / total) * 100}%`, background: r.c }} />
        ))}
      </div>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.k} className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.c }} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-200">{r.k}</p>
              <p className="text-[11px] text-zinc-500">{r.role}</p>
            </div>
            <div className="text-right font-mono text-[11px] text-zinc-400 tnum">
              <p className="text-zinc-200">{r.m.calls} calls</p>
              <p>{num(r.m.tokens / 1000, 1)}k tokens</p>
            </div>
          </li>
        ))}
        <li className="flex items-center gap-3 rounded-lg border border-acid/20 bg-acid/[0.05] px-2.5 py-2">
          <Ic n="ShieldCheck" size={14} className="text-acid" />
          <p className="text-[11px] text-zinc-300">
            Risk engine: <span className="font-mono text-acid">0</span> LLM calls. Every limit is plain code.
          </p>
        </li>
      </ul>
    </Card>
  );
}

export function NewsTriage({ className }) {
  const news = useSim((st) => st.sim.news);
  return (
    <Card className={className} title="News triage · Haiku 5.5" icon="Newspaper" sub="Sample headlines · score −1 to +1">
      <ul className="space-y-2">
        {news.slice(0, 6).map((n) => {
          const material = Math.abs(n.score) >= 0.4;
          return (
            <li key={n.id || n.head} className="animate-fadein rounded-lg border border-line bg-panel px-2.5 py-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-zinc-200">{n.sym}</span>
                <Pill tone={material ? (n.score > 0 ? 'acid' : 'rose') : 'zinc'}>{material ? 'material' : 'noise'}</Pill>
                <span className="ml-auto font-mono text-[11px] tnum" style={{ color: n.score >= 0 ? '#C6FF00' : '#FB7185' }}>
                  {n.score >= 0 ? '+' : '−'}
                  {Math.abs(n.score).toFixed(2)}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-zinc-400" title={n.head}>
                {n.head}
              </p>
              <div className="relative mt-1.5 h-1 rounded-full bg-white/[0.06]">
                <span className="absolute left-1/2 top-[-2px] h-2 w-px bg-zinc-500" />
                <span
                  className="absolute top-0 h-1 rounded-full"
                  style={{
                    left: n.score >= 0 ? '50%' : `${50 + n.score * 50}%`,
                    width: `${Math.abs(n.score) * 50}%`,
                    background: n.score >= 0 ? '#C6FF00' : '#F43F5E',
                  }}
                />
              </div>
            </li>
          );
        })}
        {!news.length && <li className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-zinc-500">No headlines triaged yet</li>}
      </ul>
    </Card>
  );
}
