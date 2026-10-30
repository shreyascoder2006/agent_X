import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { useSim } from '../../store/useSim.js';
import { useUI, startDemoWithIntro } from '../../store/useUI.js';
import { NAV } from '../../data/constants.js';
import { UNIVERSE } from '../../data/universe.js';
import { Ic, Kbd, Monogram } from '../ui/primitives.jsx';
import { cx } from '../../lib/cx.js';
import { fmtP, pct, plural } from '../../lib/format.js';
import { MOD } from './TopBar.jsx';

const item =
  'flex h-10 cursor-pointer select-none items-center gap-3 rounded-lg px-3 text-body text-fg-2 data-[selected=true]:bg-white/[0.06] data-[selected=true]:text-fg aria-disabled:opacity-40';
const group = '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-cap [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-fg-3';

function Row({ icon, label, hint, onSelect, value, tone, children }) {
  return (
    <Command.Item value={value || label} onSelect={onSelect} className={item}>
      {children || <Ic n={icon} size={15} className={tone === 'rose' ? 'text-risk-text' : 'text-fg-3'} />}
      <span className={cx('flex-1 truncate', tone === 'rose' && 'text-risk-text')}>{label}</span>
      {hint && <span className="text-cap text-fg-3">{hint}</span>}
    </Command.Item>
  );
}

export function CommandPalette() {
  const open = useUI((s) => s.palette);
  const setOpen = useUI((s) => s.setPalette);
  const openDrawer = useUI((s) => s.openDrawer);
  const setSpotlight = useUI((s) => s.setSpotlight);
  const spotlight = useUI((s) => s.spotlight);
  const navigate = useNavigate();
  const sim = useSim((st) => st.sim);
  const actions = useSim.getState();
  const [confirm, setConfirm] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) {
      setConfirm(false);
      setQ('');
    }
  }, [open]);

  const close = () => setOpen(false);
  const run = (fn) => () => {
    fn();
    close();
  };
  const D = sim.demo;
  const demo = sim.mode === 'demo';
  const openOrders = sim.orders.filter((o) => o.status === 'open').length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close command palette" className="absolute inset-0 bg-bg/60 backdrop-blur-[2px]" onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 480, damping: 34 } }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
            className="relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-line bg-overlay/90 shadow-pop backdrop-blur-2xl"
          >
            {confirm ? (
              <KillConfirm
                positions={sim.positions.length}
                orders={openOrders}
                onCancel={() => setConfirm(false)}
                onConfirm={() => {
                  actions.kill();
                  close();
                }}
              />
            ) : (
              <Command label="Command palette" loop className="flex flex-col" onKeyDown={(e) => e.key === 'Escape' && close()}>
                <div className="flex items-center gap-3 border-b border-hair px-4">
                  <Ic n="Search" size={16} className="text-fg-3" />
                  <Command.Input
                    autoFocus
                    value={q}
                    onValueChange={setQ}
                    placeholder="Type a command, a view, a symbol or a journal ID…"
                    className="h-12 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-3"
                  />
                  <Kbd>Esc</Kbd>
                </div>
                <Command.List className={cx('scroll-thin max-h-[min(60vh,440px)] overflow-y-auto p-1.5', group)}>
                  <Command.Empty className="px-3 py-8 text-center text-body text-fg-3">No matches for “{q}”.</Command.Empty>

                  <Command.Group heading="Go to">
                    {NAV.map((n, i) => (
                      <Row key={n.id} icon={n.icon} label={n.label} hint={n.short} value={`go ${n.label} ${n.short}`} onSelect={run(() => navigate(`/${n.id}`))}>
                        <Ic n={n.icon} size={15} className="text-fg-3" />
                        <span className="sr-only">{i + 1}</span>
                      </Row>
                    ))}
                  </Command.Group>

                  <Command.Group heading="Replay">
                    {!demo && <Row icon="Play" label="Run demo" hint="1:52 scripted session" onSelect={run(() => startDemoWithIntro())} />}
                    {demo && D && !D.finished && (
                      <Row icon={D.paused ? 'Play' : 'Pause'} label={D.paused ? 'Resume replay' : 'Pause replay'} onSelect={run(() => actions.setPaused(!D.paused))} />
                    )}
                    {demo && <Row icon="RotateCcw" label="Restart replay" onSelect={run(() => startDemoWithIntro('restart'))} />}
                    {demo && <Row icon={D?.captions ? 'CaptionsOff' : 'Captions'} label={D?.captions ? 'Hide captions' : 'Show captions'} onSelect={run(() => actions.setCaptions(!D.captions))} />}
                    {demo && <Row icon="Focus" label={spotlight ? 'Turn spotlight off' : 'Turn spotlight on'} onSelect={run(() => setSpotlight(!spotlight))} />}
                    {demo && <Row icon="X" label="Exit replay" hint="back to the live session" onSelect={run(() => actions.exitDemo())} />}
                  </Command.Group>

                  <Command.Group heading="Safety">
                    {sim.halted ? (
                      <Row icon="Unlock" label="Re-arm trading (2 steps)" hint="opens Risk & Guardrails" onSelect={run(() => {
                        navigate('/risk');
                        actions.rearmStart();
                      })} />
                    ) : (
                      <Row icon="Power" tone="rose" label="Engage kill switch" hint="cancel · flatten · lock" value="kill switch halt engage stop" onSelect={() => setConfirm(true)} />
                    )}
                  </Command.Group>

                  {sim.positions.length > 0 && (
                    <Command.Group heading="Open positions">
                      {sim.positions.map((p) => {
                        const px = sim.universe[p.sym].p;
                        return (
                          <Row key={p.sym} label={`${p.sym} · ${p.qty} sh · ${p.strategy}`} value={`position ${p.sym}`} hint={`₹${fmtP(px)} · ${pct(px / p.entry - 1)}`} onSelect={run(() => openDrawer(p.sym))}>
                            <Monogram sym={p.sym} size={22} tone="held" />
                          </Row>
                        );
                      })}
                    </Command.Group>
                  )}

                  <Command.Group heading="Journal">
                    {sim.journal.slice(0, 8).map((e) => (
                      <Row
                        key={e.id}
                        icon="NotebookPen"
                        label={`${e.id} · ${e.sym === '—' ? 'Sat out' : `${e.side} ${e.sym}`} · ${e.strategy}`}
                        hint={e.day}
                        value={`journal ${e.id} ${e.sym} ${e.strategy}`}
                        onSelect={run(() => navigate(`/journal?entry=${e.id}`))}
                      />
                    ))}
                  </Command.Group>

                  {q.length > 0 && (
                    <Command.Group heading="Instruments · NIFTY 50">
                      {UNIVERSE.map((u) => {
                        const px = sim.universe[u.sym].p;
                        return (
                          <Row key={u.sym} label={u.sym} value={`instrument ${u.sym} ${u.sector}`} hint={`${u.sector} · ₹${fmtP(px)} · ${pct(px / u.prev - 1)}`} onSelect={run(() => openDrawer(u.sym))}>
                            <Monogram sym={u.sym} size={22} />
                          </Row>
                        );
                      })}
                    </Command.Group>
                  )}
                </Command.List>
                <div className="flex items-center gap-4 border-t border-hair px-4 py-2 text-cap text-fg-3">
                  <span className="flex items-center gap-1.5">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd> navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Kbd>↵</Kbd> run
                  </span>
                  <span className="ml-auto flex items-center gap-1.5">
                    <Kbd>{MOD} K</Kbd> toggle
                  </span>
                </div>
              </Command>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function KillConfirm({ positions, orders, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel, onConfirm]);
  return (
    <div className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-risk/40 bg-risk/10 text-risk-text">
          <Ic n="Power" size={18} sw={2.2} />
        </span>
        <div>
          <p className="text-h2 text-fg">Halt all trading?</p>
          <p className="mt-1 text-body text-fg-2">
            Cancels {plural(orders, 'open order')}, flattens {plural(positions, 'position')} at market and locks new orders. Re-arming takes two steps.
          </p>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="inline-flex h-8 items-center gap-2 rounded-lg border border-hair px-3 text-body text-fg-2 hover:border-line hover:text-fg">
          Cancel <Kbd>Esc</Kbd>
        </button>
        <button type="button" autoFocus onClick={onConfirm} className="inline-flex h-8 items-center gap-2 rounded-lg bg-risk px-3 text-body font-semibold text-white hover:brightness-110">
          Halt trading <Kbd className="border-white/30 text-white/80">↵</Kbd>
        </button>
      </div>
    </div>
  );
}
