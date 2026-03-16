import React from 'react';
import SimCanvas from './ui/panels/SimCanvas';
import ControlPanel from './ui/panels/ControlPanel';
import AnalysisPanel from './ui/panels/AnalysisPanel';
import EnergyChart from './ui/charts/EnergyChart';
import { useSimLoop } from './ui/hooks/useSimLoop';
import './index.css';

function App() {
  // Drive the simulation loop via rAF
  useSimLoop();

  return (
    <div className="app-container">
      {/* Main viewport */}
      <main className="viewport">
        <SimCanvas />
      </main>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">N-Body</h1>
          <span className="app-subtitle">Gravitational Simulator</span>
        </div>
        <div className="sidebar-content">
          <ControlPanel />
          <AnalysisPanel />
          <EnergyChart />
        </div>
      </aside>
    </div>
  );
}

export default App;
