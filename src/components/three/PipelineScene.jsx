// The agent pipeline in 3D: Ingest → Reason → Risk engine → Paper broker → Journal.
// Packets flow along the links; the busy stage pulses; the kill switch cuts the flow.
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { STAGES } from '../../data/constants.js';
import { useSim } from '../../store/useSim.js';
import { SceneBoundary, webglAvailable } from './support.jsx';
import { cx } from '../../lib/cx.js';

const POS = {
  ingest: [-5.2, 0, 0.8],
  reason: [-2.6, 0, -0.35],
  risk: [0, 0, -0.75],
  broker: [2.6, 0, -0.35],
  journal: [5.2, 0, 0.8],
};
const ORDER = ['ingest', 'reason', 'risk', 'broker', 'journal'];
const KILL = [1.3, 2.5, -0.6];
const ROSE = new THREE.Color('#F43F5E');
const LIME = new THREE.Color('#C6FF00');
const LAVENDER = new THREE.Color('#A5B4FC');
const TUBE = new THREE.Color('#3f3f46');
const TUBE_CUT = new THREE.Color('#7f1d2d');

export function stageStatus(sim, id) {
  if (sim.halted && (id === 'risk' || id === 'broker')) return 'halted';
  if (sim.stage === id && sim.rt - sim.stageAt < 2.6) return 'busy';
  return 'ok';
}

function Shape({ id }) {
  if (id === 'ingest') return <icosahedronGeometry args={[0.62, 0]} />;
  if (id === 'reason') return <torusKnotGeometry args={[0.38, 0.12, 128, 16]} />;
  if (id === 'risk') return <octahedronGeometry args={[0.7, 0]} />;
  if (id === 'broker') return <cylinderGeometry args={[0.56, 0.56, 0.6, 6]} />;
  return <boxGeometry args={[0.92, 0.56, 0.7]} />;
}

function NodeLabel({ stage, selected, onSelect }) {
  const status = useSim((st) => stageStatus(st.sim, stage.id));
  return (
    <button
      type="button"
      onClick={() => onSelect(stage.id)}
      className={cx(
        'flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-semibold backdrop-blur transition',
        selected ? 'border-acid/60 bg-acid/15 text-acid' : 'border-line2 bg-ink/80 text-zinc-200 hover:border-zinc-500',
      )}
    >
      <span
        className={cx(
          'h-1.5 w-1.5 rounded-full',
          status === 'halted' ? 'bg-rose-500' : status === 'busy' ? 'animate-pulse bg-acid' : 'bg-green-500',
        )}
      />
      {stage.name}
    </button>
  );
}

function StageNode({ stage, selected, onSelect }) {
  const mesh = useRef(null);
  const mat = useRef(null);
  const halo = useRef(null);
  const [hover, setHover] = useState(false);
  const base = useMemo(() => new THREE.Color(stage.color), [stage.color]);
  useFrame((state, dt) => {
    const s = useSim.getState().sim;
    const status = stageStatus(s, stage.id);
    const busy = status === 'busy';
    const col = status === 'halted' ? ROSE : base;
    const m = mesh.current;
    if (!m || !mat.current) return;
    m.rotation.y += dt * (busy ? 1.9 : 0.35);
    m.rotation.x += dt * 0.1;
    const target = (busy ? 1.22 : 1) * (hover || selected ? 1.1 : 1);
    m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, target, Math.min(1, dt * 8)));
    const k = Math.min(1, dt * 6);
    mat.current.color.lerp(col, k);
    mat.current.emissive.lerp(col, k);
    const t = state.clock.elapsedTime;
    const ei = busy ? 1.1 + Math.sin(t * 8) * 0.3 : status === 'halted' ? 0.9 : selected || hover ? 0.65 : 0.3;
    mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, ei, k);
    if (halo.current) {
      halo.current.material.color.lerp(col, k);
      halo.current.material.opacity = THREE.MathUtils.lerp(halo.current.material.opacity, busy || selected ? 0.95 : 0.4, k);
      const p = busy ? 1 + Math.sin(t * 6) * 0.07 : 1;
      halo.current.scale.set(p, p, p);
    }
  });
  return (
    <group position={POS[stage.id]}>
      <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.5} floatingRange={[-0.08, 0.12]}>
        <mesh
          ref={mesh}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(stage.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = '';
          }}
        >
          <Shape id={stage.id} />
          <meshStandardMaterial ref={mat} color={stage.color} emissive={stage.color} emissiveIntensity={0.3} roughness={0.3} metalness={0.35} flatShading />
        </mesh>
      </Float>
      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.92, 0]}>
        <ringGeometry args={[0.8, 0.92, 64]} />
        <meshBasicMaterial color={stage.color} transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.94, 0]}>
        <circleGeometry args={[0.8, 64]} />
        <meshBasicMaterial color="#101013" transparent opacity={0.92} />
      </mesh>
      <Html position={[0, -1.45, 0]} center zIndexRange={[20, 0]}>
        <NodeLabel stage={stage} selected={selected} onSelect={onSelect} />
      </Html>
    </group>
  );
}

function Link3D({ from, to, idx }) {
  const curve = useMemo(() => {
    const a = new THREE.Vector3(...POS[from]);
    const b = new THREE.Vector3(...POS[to]);
    const mid = a.clone().lerp(b, 0.5);
    mid.y += 0.55;
    return new THREE.CatmullRomCurve3([a, mid, b]);
  }, [from, to]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 64, 0.03, 8, false), [curve]);
  const dots = useRef([]);
  const tubeMat = useRef(null);
  const N = 7;
  useFrame((_, dt) => {
    const s = useSim.getState().sim;
    const cut = s.halted && idx >= 2;
    const busy = s.rt - s.stageAt < 2.6;
    const speed = cut ? 0 : busy ? 0.6 : 0.2;
    dots.current.forEach((m, i) => {
      if (!m) return;
      m.userData.u = ((m.userData.u ?? i / N) + dt * speed) % 1;
      m.position.copy(curve.getPointAt(m.userData.u));
      m.material.color.copy(cut ? ROSE : idx % 2 ? LIME : LAVENDER);
    });
    if (tubeMat.current) tubeMat.current.color.copy(cut ? TUBE_CUT : TUBE);
  });
  return (
    <group>
      <mesh geometry={tube}>
        <meshBasicMaterial ref={tubeMat} color="#3f3f46" transparent opacity={0.65} />
      </mesh>
      {Array.from({ length: N }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            dots.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.065, 12, 12]} />
          <meshBasicMaterial color="#C6FF00" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function KillLabel() {
  const halted = useSim((st) => st.sim.halted);
  return (
    <div
      className={cx(
        'whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-semibold backdrop-blur',
        halted ? 'border-rose-400 bg-rose-500 text-white' : 'border-rose-500/50 bg-ink/80 text-rose-300',
      )}
    >
      {halted ? 'Kill switch · HALTED' : 'Human kill switch'}
    </div>
  );
}

function KillNode() {
  const ring = useRef(null);
  const mat = useRef(null);
  const core = useRef(null);
  useFrame((state, dt) => {
    const s = useSim.getState().sim;
    const t = state.clock.elapsedTime;
    if (!ring.current || !mat.current || !core.current) return;
    ring.current.rotation.z += dt * (s.halted ? 0 : 0.8);
    ring.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.6) * 0.25;
    const cue = s.demo && s.demo.killCue && !s.halted;
    const target = s.halted ? 2.4 : cue ? 1.3 + Math.sin(t * 9) * 0.9 : 0.35;
    mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, target, Math.min(1, dt * 8));
    core.current.scale.setScalar(s.halted ? 1.3 : cue ? 1 + Math.sin(t * 9) * 0.14 : 1);
  });
  return (
    <group>
      <group position={KILL}>
        <mesh ref={ring}>
          <torusGeometry args={[0.36, 0.06, 16, 64]} />
          <meshStandardMaterial ref={mat} color="#F43F5E" emissive="#F43F5E" emissiveIntensity={0.35} roughness={0.3} />
        </mesh>
        <mesh ref={core}>
          <sphereGeometry args={[0.17, 32, 32]} />
          <meshStandardMaterial color="#FB7185" emissive="#F43F5E" emissiveIntensity={0.8} />
        </mesh>
        <Html position={[0, 0.66, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <KillLabel />
        </Html>
      </group>
      <Line points={[KILL, [POS.risk[0], 0.6, POS.risk[2]]]} color="#F43F5E" lineWidth={1.2} dashed dashSize={0.14} gapSize={0.1} transparent opacity={0.75} />
      <Line points={[KILL, [POS.broker[0], 0.55, POS.broker[2]]]} color="#F43F5E" lineWidth={1.2} dashed dashSize={0.14} gapSize={0.1} transparent opacity={0.75} />
    </group>
  );
}

/** Slow sway of the whole scene; leaves the camera to OrbitControls. */
function Sway({ children }) {
  const g = useRef(null);
  useFrame((state) => {
    if (g.current) g.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.22;
  });
  return <group ref={g}>{children}</group>;
}

function Fallback({ selected, onSelect, height }) {
  return (
    <div className="flex items-center justify-between gap-2 overflow-x-auto px-4" style={{ height }}>
      {STAGES.map((st, i) => (
        <div key={st.id} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelect(st.id)}
            className={cx('rounded-xl border px-4 py-6 text-sm font-semibold', selected === st.id ? 'border-acid bg-acid/10 text-acid' : 'border-line2 bg-panel text-zinc-200')}
          >
            {st.name}
          </button>
          {i < STAGES.length - 1 && <span className="text-acid">→</span>}
        </div>
      ))}
    </div>
  );
}

export default function PipelineScene({ selected, onSelect, height = 470 }) {
  const ok = useMemo(webglAvailable, []);
  if (!ok) return <Fallback selected={selected} onSelect={onSelect} height={height} />;
  return (
    <div className="relative isolate overflow-hidden rounded-lg bg-[radial-gradient(ellipse_at_50%_40%,rgba(99,102,241,0.12),transparent_60%)]" style={{ height }}>
      <SceneBoundary fallback={<Fallback selected={selected} onSelect={onSelect} height={height} />}>
        <Canvas dpr={[1, 2]} camera={{ position: [0, 4.4, 10.8], fov: 42 }} gl={{ antialias: true, alpha: true }} onPointerMissed={() => onSelect(null)}>
          <fog attach="fog" args={['#09090B', 14, 28]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[4, 9, 6]} intensity={1.7} />
          <pointLight position={[0, 3.5, 2.5]} intensity={26} distance={14} color="#C6FF00" />
          <pointLight position={[-6, 2, 3]} intensity={22} distance={12} color="#6366F1" />
          <gridHelper args={[30, 60, '#232329', '#141418']} position={[0, -0.96, 0]} />
          <Sway>
            {STAGES.map((st) => (
              <StageNode key={st.id} stage={st} selected={selected === st.id} onSelect={onSelect} />
            ))}
            {ORDER.slice(0, -1).map((id, i) => (
              <Link3D key={id} from={id} to={ORDER[i + 1]} idx={i} />
            ))}
            <KillNode />
          </Sway>
          <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0.75} maxPolarAngle={1.42} minAzimuthAngle={-0.9} maxAzimuthAngle={0.9} enableDamping dampingFactor={0.08} />
        </Canvas>
      </SceneBoundary>
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-3 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> healthy
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acid" /> working now
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> halted
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-[10px] text-zinc-500">drag to orbit · click a stage</div>
    </div>
  );
}
