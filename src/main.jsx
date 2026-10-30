import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { initialPath } from './hooks/useHashSync.js';
import './index.css';

// MemoryRouter + a plain `#view` hash keeps routing working on any static host.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={[initialPath()]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  </React.StrictMode>,
);
