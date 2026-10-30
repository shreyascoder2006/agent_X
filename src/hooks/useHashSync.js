// Keeps the router in step with a plain `#view` hash, so a view can be bookmarked
// (and so the app works inside hosts that only pass plain hashes).
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV } from '../data/constants.js';

const IDS = NAV.map((n) => n.id);
const fromHash = () => (window.location.hash || '').replace(/^#\/?/, '');

export function initialPath() {
  const h = fromHash();
  return IDS.includes(h) ? `/${h}` : '/dashboard';
}

export function useHashSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = useRef(location.pathname);
  current.current = location.pathname;

  useEffect(() => {
    const id = location.pathname.replace(/^\//, '');
    if (!IDS.includes(id) || fromHash() === id) return;
    try {
      window.history.replaceState(null, '', `#${id}`);
    } catch {
      /* some sandboxes refuse history writes; the app still routes in memory */
    }
  }, [location.pathname]);

  useEffect(() => {
    const onHash = () => {
      const h = fromHash();
      if (IDS.includes(h) && current.current !== `/${h}`) navigate(`/${h}`);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [navigate]);
}
