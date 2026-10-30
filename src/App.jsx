import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig, motion } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { TopBar } from './components/layout/TopBar.jsx';
import { Ticker } from './components/layout/Ticker.jsx';
import { HaltBanner, HaltFX } from './components/layout/HaltBanner.jsx';
import { StatusBar } from './components/layout/StatusBar.jsx';
import { CommandPalette } from './components/layout/CommandPalette.jsx';
import { DemoLayer } from './components/layout/DemoBar.jsx';
import { DemoDirector, Toasts } from './components/layout/Toasts.jsx';
import { InstrumentDrawer } from './components/trading/InstrumentDrawer.jsx';
import { ReadyContext, pageMotion } from './components/ui/primitives.jsx';
import { useHashSync } from './hooks/useHashSync.js';
import { startEngine, useSim } from './store/useSim.js';
import './lib/tape.js';
import { cx } from './lib/cx.js';
import Dashboard from './pages/Dashboard.jsx';
import Activity from './pages/Activity.jsx';
import Journal from './pages/Journal.jsx';
import Backtest from './pages/Backtest.jsx';
import Risk from './pages/Risk.jsx';
import Architecture from './pages/Architecture.jsx';
import Landing from './landing/Landing.jsx';

let firstLoad = true;

/** Skeletons for ~500 ms on first load, a shorter beat on route changes. */
function useReadyFlag(path) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const demo = useSim.getState().sim.mode === 'demo';
    const ms = firstLoad ? 520 : demo ? 260 : 380;
    firstLoad = false;
    const id = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(id);
  }, [path]);
  return ready;
}

export default function App() {
  useEffect(() => startEngine(), []);
  useHashSync();
  const location = useLocation();
  const demo = useSim((st) => st.sim.mode === 'demo');
  const ready = useReadyFlag(location.pathname);

  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0 });
  }, [location.pathname]);

  if (location.pathname === '/home') {
    return (
      <MotionConfig reducedMotion="user">
        <Landing />
        <CommandPalette />
        <DemoDirector />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-full overflow-hidden text-fg">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <TopBar />
          <Ticker />
          <HaltBanner />
          <main id="main" className="scroll-thin relative flex-1 overflow-y-auto overflow-x-hidden">
            <ReadyContext.Provider value={ready}>
              <motion.div
                key={location.pathname}
                initial="hidden"
                animate="show"
                variants={pageMotion}
                className={cx('content-x pt-6', demo ? 'pb-44' : 'pb-10')}
              >
                <Routes location={location}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/activity" element={<Activity />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/backtest" element={<Backtest />} />
                  <Route path="/risk" element={<Risk />} />
                  <Route path="/architecture" element={<Architecture />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </motion.div>
            </ReadyContext.Provider>
          </main>
          <DemoLayer />
          <StatusBar />
        </div>
        <InstrumentDrawer />
        <CommandPalette />
        <Toasts />
        <HaltFX />
        <DemoDirector />
      </div>
    </MotionConfig>
  );
}
