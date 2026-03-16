import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ─── WebGPU feature detection ───────────────────────────────────
if (!navigator.gpu) {
  console.warn(
    '[N-Body] WebGPU is not available. Running in CPU-only mode with Canvas2D renderer.',
  );
} else {
  console.log('[N-Body] WebGPU detected — GPU acceleration available.');
}

// ─── Mount React app ────────────────────────────────────────────
const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
