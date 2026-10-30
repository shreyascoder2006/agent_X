import { useEffect, useRef, useState } from 'react';

/** Eases a number toward `target` so big figures roll instead of jumping. */
export function useTween(target, ms = 450) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const from = current.current;
    if (from === target) return undefined;
    const start = performance.now();
    let raf = 0;
    const frame = (now) => {
      const u = Math.min(1, (now - start) / ms);
      const e = 1 - (1 - u) ** 3;
      const x = from + (target - from) * e;
      current.current = x;
      setValue(x);
      if (u < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}
