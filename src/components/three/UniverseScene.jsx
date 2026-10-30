// 3D bar field of the 50-stock universe: height = % change today, lime up, rose down.
// Held positions get a ring and a live P&L label; each scan sweeps a light across the grid.
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { UNIVERSE } from '../../data/universe.js';
import { useSim } from '../../store/useSim.js';
import { SceneBoundary, webglAvailable } from './support.jsx';
import { fmtP, inr, pct } from '../../lib/format.js';
import { cx } from '../../lib/cx.js';

const GAP = 1.12;
const CELLS = UNIVERSE.map((u, i) => ({ ...u, x: ((i % 10) - 4.5) * GAP, z: (Math.floor(i / 10) - 2) * GAP }));
const BY_SYM = Object.fromEntries(CELLS.map((c) => [c.sym, c]));
const UP = new THREE.Color('#C6FF00');
const DOWN = new THREE.Color('#F43F5E');
const DIM = new THREE.Color('#2c2c33');
const SWEEP_S = 2.6;
const heightOf = (chg) => Math.sign(chg || 1) * Math.max(0.06, Math.abs(chg) * 100 * 0.95);

function Sweep({ sweep }) {
  const ref = useRef(null);
  const seen = useRef(null);
  useFrame((state) => {
    const s = useSim.getState().sim;
    if (s.scanAt !== seen.current) {
      seen.current = s.scanAt;
      sweep.current.start = s.rt - s.scanAt < SWEEP_S ? state.clock.elapsedTime : -99;
    }
    const age = state.clock.elapsedTime - sweep.current.start;
    const on = age >= 0 && age < SWEEP_S;
    sweep.current.x = on ? -6.6 + (age / SWEEP_S) * 13.2 : -99;
    if (ref.current) {
      ref.current.visible = on;
      ref.current.position.x = sweep.current.x;
      ref.current.material.opacity = on ? 0.4 * Math.sin((Math.PI * age) / SWEEP_S) : 0;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <planeGeometry args={[0.4, 6.4]} />
      <meshBasicMaterial color="#C6FF00" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function Bars({ hover, setHover, sweep }) {
  const meshes = useRef([]);
  const mats = useRef([]);
  const tmp = useMemo(() => new THREE.Color(), []);
  useFrame((_, dt) => {
    const s = useSim.getState().sim;
    const held = new Set(s.positions.map((p) => p.sym));
    const k = Math.min(1, dt * 4);
    for (let i = 0; i < CELLS.length; i++) {
      const m = meshes.current[i];
      const mat = mats.current[i];
      if (!m || !mat) continue;
      const c = CELLS[i];
      const chg = s.universe[c.sym].p / c.prev - 1;
      const h0 = m.userData.h ?? 0.06;
      const h = h0 + (heightOf(chg) - h0) * k;
      m.userData.h = h;
      m.scale.y = Math.max(0.03, Math.abs(h));
      m.position.y = h / 2;
      const mag = Math.min(1, Math.abs(chg) / 0.022);
      tmp.copy(DIM).lerp(chg >= 0 ? UP : DOWN, 0.3 + 0.7 * mag);
      mat.color.copy(tmp);
      mat.emissive.copy(tmp);
      let glow = held.has(c.sym) ? 0.75 : 0.1;
      glow += Math.max(0, 1 - Math.abs(c.x - sweep.current.x) / 1.3) * 1.2;
      if (hover === i) glow += 0.6;
      mat.emissiveIntensity += (glow - mat.emissiveIntensity) * Math.min(1, dt * 9);
    }
  });
  return CELLS.map((c, i) => (
    <mesh
      key={c.sym}
      ref={(el) => {
        meshes.current[i] = el;
      }}
      position={[c.x, 0, c.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(i);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover((h) => (h === i ? null : h));
        document.body.style.cursor = '';
      }}
    >
      <boxGeometry args={[0.72, 1, 0.72]} />
      <meshStandardMaterial
        ref={(el) => {
          mats.current[i] = el;
        }}
        roughness={0.35}
        metalness={0.25}
      />
    </mesh>
  ));
}

function Held() {
  const positions = useSim((st) => st.sim.positions);
  const universe = useSim((st) => st.sim.universe);
  return positions.map((p) => {
    const c = BY_SYM[p.sym];
    if (!c) return null;
    const px = universe[p.sym].p;
    const pnl = (px - p.entry) * p.qty;
    const top = Math.max(0, heightOf(px / c.prev - 1));
    return (
      <group key={p.sym} position={[c.x, 0, c.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.56, 0.66, 48]} />
          <meshBasicMaterial color="#C6FF00" transparent opacity={0.9} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <Html position={[0, top + 0.55, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className={cx(
              'whitespace-nowrap rounded-md border bg-ink/85 px-1.5 py-0.5 font-mono text-[10px] shadow-glowsm backdrop-blur',
              pnl >= 0 ? 'border-acid/40 text-acid' : 'border-rose-400/50 text-rose-300',
            )}
          >
            {p.sym} {inr(pnl, 0, true)}
          </div>
        </Html>
      </group>
    );
  });
}

function HoverTip({ i }) {
  const universe = useSim((st) => st.sim.universe);
  const held = useSim((st) => st.sim.positions.some((p) => i != null && p.sym === CELLS[i].sym));
  if (i == null) return null;
  const c = CELLS[i];
  const px = universe[c.sym].p;
  const chg = px / c.prev - 1;
  return (
    <Html position={[c.x, Math.max(0, heightOf(chg)) + 1.05, c.z]} center zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
      <div className="w-40 rounded-lg border border-line2 bg-panel/95 px-2.5 py-2 text-[11px] shadow-2xl backdrop-blur">
        <p className="flex items-center justify-between font-semibold text-zinc-100">
          {c.sym}
          {held && <span className="rounded bg-acid px-1 text-[9px] font-bold text-ink">HELD</span>}
        </p>
        <p className="text-zinc-500">
          {c.sector} · beta {c.beta.toFixed(1)}
        </p>
        <p className="mt-1 font-mono text-zinc-200 tnum">
          ₹{fmtP(px)} <span className={chg >= 0 ? 'text-acid' : 'text-rose-400'}>{pct(chg)}</span>
        </p>
      </div>
    </Html>
  );
}

function Fallback({ height }) {
  const universe = useSim((st) => st.sim.universe);
  return (
    <div className="grid grid-cols-10 gap-1 rounded-lg p-2" style={{ height }}>
      {CELLS.map((c) => {
        const chg = universe[c.sym].p / c.prev - 1;
        const a = Math.min(1, Math.abs(chg) / 0.022) * 0.7 + 0.12;
        return (
          <div
            key={c.sym}
            title={`${c.sym} ${pct(chg)}`}
            className="grid place-items-center rounded font-mono text-[9px] text-zinc-200"
            style={{ background: chg >= 0 ? `rgba(198,255,0,${a})` : `rgba(244,63,94,${a})` }}
          >
            {c.sym.slice(0, 4)}
          </div>
        );
      })}
    </div>
  );
}

export default function UniverseScene({ height = 330, fill = false }) {
  const [hover, setHover] = useState(null);
  const sweep = useRef({ x: -99, start: -99 });
  const ok = useMemo(webglAvailable, []);
  if (!ok) return <Fallback height={height} />;
  return (
    <div
      className="relative isolate flex-1 overflow-hidden rounded-lg bg-[radial-gradient(ellipse_at_center,rgba(198,255,0,0.05),transparent_65%)]"
      style={fill ? { minHeight: height } : { height }}
    >
      <SceneBoundary fallback={<Fallback height={height} />}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 8.8, 13.4], fov: 34 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onPointerMissed={() => setHover(null)}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[6, 12, 8]} intensity={1.8} />
          <pointLight position={[-6, 4, -3]} intensity={32} distance={18} color="#C6FF00" />
          <pointLight position={[6, 3, 4]} intensity={24} distance={16} color="#6366F1" />
          <gridHelper args={[14, 28, '#2a2a31', '#19191e']} position={[0, -0.004, 0]} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
            <planeGeometry args={[12.2, 6.2]} />
            <meshBasicMaterial color="#111114" transparent opacity={0.62} />
          </mesh>
          <Sweep sweep={sweep} />
          <Bars hover={hover} setHover={setHover} sweep={sweep} />
          <Held />
          <HoverTip i={hover} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} minPolarAngle={0.55} maxPolarAngle={1.25} enableDamping dampingFactor={0.08} />
        </Canvas>
      </SceneBoundary>
      <div className="pointer-events-none absolute bottom-2 left-3 flex flex-wrap items-center gap-3 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-acid" /> up today
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-rose-500" /> down today
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full ring-2 ring-acid" /> held
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-zinc-500">drag to orbit · hover a bar</div>
    </div>
  );
}
