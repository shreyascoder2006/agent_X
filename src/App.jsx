import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Header } from './components/layout/Header.jsx';
import { Ticker } from './components/layout/Ticker.jsx';
import { HaltBanner } from './components/layout/HaltBanner.jsx';
import { DemoBar } from './components/layout/DemoBar.jsx';
import { DemoDirector, Toasts } from './components/layout/Toasts.jsx';
import { useHashSync } from './hooks/useHashSync.js';
import { startEngine, useSim } from './store/useSim.js';
import { cx } from './lib/cx.js';
import Dashboard from './pages/Dashboard.jsx';
import Activity from './pages/Activity.jsx';
import Journal from './pages/Journal.jsx';
import Backtest from './pages/Backtest.jsx';
import Risk from './pages/Risk.jsx';
import Architecture from './pages/Architecture.jsx';
import Landing from './landing/Landing.jsx';

export default function App() {
  useEffect(() => startEngine(), []);
  useHashSync();
  const location = useLocation();
  const demo = useSim((st) => st.sim.mode === 'demo');

  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  if (location.pathname === '/home') {
    return (
      <>
        <Landing />
        <DemoDirector />
      </>
    );
  }

  return (
    <div className="app-bg flex h-full overflow-hidden text-zinc-200">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <main id="main" className="scroll-thin relative flex-1 overflow-y-auto overflow-x-hidden">
          <Header />
          <Ticker />
          <HaltBanner />
          <div key={location.pathname} className={cx('content-x animate-viewin pt-5', demo ? 'pb-48' : 'pb-12')}>
            <Routes location={location}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/backtest" element={<Backtest />} />
              <Route path="/risk" element={<Risk />} />
              <Route path="/architecture" element={<Architecture />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
          <DemoBar />
        </main>
      </div>
      <Toasts />
      <DemoDirector />
    </div>
  );
}
