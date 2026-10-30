import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSim } from '../store/useSim.js';
import { Card, Ic, Pill, Segmented } from '../components/ui/primitives.jsx';
import { FeedItem, LoopStepper, ModelUsage, NewsTriage, ToolStats } from '../components/trading/Agent.jsx';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'tools', label: 'Tool calls' },
  { id: 'thinking', label: 'Decisions' },
  { id: 'risk', label: 'Risk' },
];

const match = (f, it) => {
  if (f === 'all') return true;
  if (f === 'tools') return it.kind === 'tool';
  if (f === 'thinking') return it.kind === 'planner' || it.kind === 'decision' || it.kind === 'user';
  return it.kind === 'risk' || it.kind === 'halt' || (it.kind === 'tool' && (it.tool === 'risk_check' || it.status === 'veto' || it.status === 'blocked'));
};

export default function Activity() {
  const feed = useSim((st) => st.sim.feed);
  const halted = useSim((st) => st.sim.halted);
  const mode = useSim((st) => st.sim.mode);
  const [filter, setFilter] = useState('all');
  const [stick, setStick] = useState(true);
  const box = useRef(null);
  const items = useMemo(() => feed.filter((it) => match(filter, it)).slice(-140), [feed, filter]);
  const pending = feed.some((it) => it.status === 'pending' || it.status === 'thinking');
  const lastId = items.length ? items[items.length - 1].id : 0;
  const seenId = useRef(lastId);
  const unseen = stick ? 0 : items.filter((it) => it.id > seenId.current).length;
  if (stick) seenId.current = lastId;

  useLayoutEffect(() => {
    const el = box.current;
    if (el && stick) el.scrollTop = el.scrollHeight;
  });

  const onScroll = () => {
    const el = box.current;
    if (!el) return;
    setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  };

  const jump = () => {
    const el = box.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setStick(true);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <Card
        className="xl:col-span-8"
        title="Live reasoning feed"
        icon="BrainCircuit"
        sub={mode === 'demo' ? 'Replay of a full session, as the agent logged it' : 'Every message, tool call and decision, as it happens'}
        right={
          <>
            <Segmented options={FILTERS} value={filter} onChange={setFilter} label="Filter the feed" />
            <Pill tone={halted ? 'rose' : 'acid'} dot pulse>
              {halted ? 'halted' : 'streaming'}
            </Pill>
          </>
        }
        body="relative px-3 pb-3"
      >
        <div ref={box} onScroll={onScroll} className="scroll-thin h-[min(68vh,720px)] min-h-[440px] overflow-y-auto pr-1">
          <ol className="space-y-0.5">
            {items.map((it) => (
              <FeedItem key={it.id} it={it} />
            ))}
          </ol>
          {pending && !halted && (
            <div className="mt-2 flex items-center gap-2 px-2 pb-2 text-xs text-zinc-500">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-acid [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-acid [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-acid" />
              </span>
              Niyam is working…
            </div>
          )}
        </div>
        {!stick && (
          <button
            type="button"
            onClick={jump}
            className="absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 animate-fadein items-center gap-1.5 rounded-full bg-acid px-3 py-1.5 text-xs font-semibold text-ink shadow-glow"
          >
            <Ic n="ArrowDownRight" size={13} sw={2.4} />
            {unseen ? `${unseen} new · jump to latest` : 'Jump to latest'}
          </button>
        )}
      </Card>

      <div className="space-y-4 xl:col-span-4">
        <LoopStepper />
        <ToolStats />
        <ModelUsage />
        <NewsTriage />
      </div>
    </div>
  );
}
