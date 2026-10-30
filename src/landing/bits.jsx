// ReactBits-style helpers from the landing page: BlurText, CountUp, DotGrid, ShinyText, TiltedCard.
import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useSpring } from 'framer-motion';

/** Staggers words in from a blur as the text enters the viewport. */
export function BlurText({ text, className = '', delay = 90 }) {
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={{ filter: 'blur(10px)', opacity: 0, y: -10 }}
          whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: (i * delay) / 1000, ease: 'easeOut' }}
          className="inline-block will-change-[filter,transform]"
        >
          {w}
          {i < words.length - 1 ? ' ' : null}
        </motion.span>
      ))}
    </span>
  );
}

/** Animates a number up the first time it scrolls into view (Indian digit grouping). */
export function CountUp({ to, from = 0, duration = 2, className = '', decimals = 0, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(from, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setValue });
    return () => controls.stop();
  }, [inView, from, to, duration]);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/** Canvas dot lattice whose dots swell near the cursor. */
export function DotGrid({ gap = 30, dotSize = 1.5, baseColor = 'rgba(184, 241, 77, 0.16)', activeColor = 'rgba(215, 255, 138, 0.95)', proximity = 150 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) return undefined;
    let raf = 0;
    let dots = [];
    const pointer = { x: -9999, y: -9999 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const build = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) dots.push({ x, y });
    };
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (const d of dots) {
        const t = Math.max(0, 1 - Math.hypot(d.x - pointer.x, d.y - pointer.y) / proximity);
        const e = t * t * (3 - 2 * t);
        ctx.beginPath();
        ctx.arc(d.x, d.y, dotSize + e * dotSize * 1.7, 0, Math.PI * 2);
        ctx.fillStyle = e > 0.03 ? activeColor : baseColor;
        ctx.globalAlpha = 0.4 + e * 0.6;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    build();
    draw();
    window.addEventListener('resize', build);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', build);
      window.removeEventListener('pointermove', onMove);
    };
  }, [gap, dotSize, baseColor, activeColor, proximity]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none h-full w-full" />;
}

export function ShinyText({ text, className = '', speed = 4 }) {
  return (
    <span className={`shiny-text ${className}`} style={{ animationDuration: `${speed}s` }}>
      {text}
    </span>
  );
}

/** 3D perspective tilt that follows the cursor, with a soft glare. */
export function TiltedCard({ children, className = '', rotateAmplitude = 8, glareOpacity = 0.14 }) {
  const ref = useRef(null);
  const rotateX = useSpring(0, { stiffness: 180, damping: 18, mass: 0.5 });
  const rotateY = useSpring(0, { stiffness: 180, damping: 18, mass: 0.5 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rotateY.set((px - 0.5) * rotateAmplitude * 2);
    rotateX.set(-(py - 0.5) * rotateAmplitude * 2);
    setGlare({ x: px * 100, y: py * 100, opacity: glareOpacity });
  };
  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    setGlare((g) => ({ ...g, opacity: 0 }));
  };
  return (
    <div style={{ perspective: '1100px' }} onMouseMove={onMove} onMouseLeave={onLeave}>
      <motion.div ref={ref} style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className={`relative will-change-transform ${className}`}>
        {children}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] transition-opacity duration-300"
          style={{ opacity: glare.opacity, background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.9), transparent 55%)`, mixBlendMode: 'overlay' }}
        />
      </motion.div>
    </div>
  );
}
