import { useEffect, useState } from 'react';

/** Wall-clock milliseconds, refreshed every `ms` (for countdowns). */
export function useNow(ms = 500, active = true) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms, active]);
  return now;
}
