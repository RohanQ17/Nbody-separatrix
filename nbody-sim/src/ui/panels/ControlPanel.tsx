import React from 'react';
import { useSimStore } from '../../store';
import type { IntegratorName, ForceSolverName, ScenarioName } from '../../core/types';

/**
 * Control panel for the simulation.
 * Provides play/pause, reset, dt slider, and dropdowns for
 * integrator, force solver, and scenario selection.
 */
const ControlPanel: React.FC = () => {
  const running = useSimStore((s) => s.running);
  const dt = useSimStore((s) => s.dt);
  const integratorName = useSimStore((s) => s.integratorName);
  const forceSolverName = useSimStore((s) => s.forceSolverName);
  const scenarioName = useSimStore((s) => s.scenarioName);
  const time = useSimStore((s) => s.renderTime);
  const bodyCount = useSimStore((s) => s.renderBodies.length);

  const toggleRunning = useSimStore((s) => s.toggleRunning);
  const reset = useSimStore((s) => s.reset);
  const setDt = useSimStore((s) => s.setDt);
  const setIntegrator = useSimStore((s) => s.setIntegrator);
  const setForceSolver = useSimStore((s) => s.setForceSolver);
  const setScenario = useSimStore((s) => s.setScenario);

  return (
    <div className="panel-card">
      <h3 className="panel-title">Controls</h3>

      {/* Time info */}
      <div className="info-row">
        <span className="info-label">Time</span>
        <span className="info-value">{time.toFixed(4)}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Bodies</span>
        <span className="info-value">{bodyCount}</span>
      </div>

      {/* Play / Pause / Reset */}
      <div className="button-row">
        <button
          id="btn-play-pause"
          className={`btn ${running ? 'btn-danger' : 'btn-primary'}`}
          onClick={toggleRunning}
        >
          {running ? '⏸ Pause' : '▶ Play'}
        </button>
        <button id="btn-reset" className="btn btn-secondary" onClick={reset}>
          ↺ Reset
        </button>
      </div>

      {/* Timestep slider */}
      <div className="control-group">
        <label className="control-label">
          Timestep (dt): <strong>{dt.toFixed(4)}</strong>
        </label>
        <input
          id="slider-dt"
          type="range"
          min={-4}
          max={-1}
          step={0.1}
          value={Math.log10(dt)}
          onChange={(e) => setDt(Math.pow(10, parseFloat(e.target.value)))}
          className="slider"
        />
      </div>

      {/* Scenario */}
      <div className="control-group">
        <label className="control-label">Scenario</label>
        <select
          id="select-scenario"
          className="select"
          value={scenarioName}
          onChange={(e) => setScenario(e.target.value as ScenarioName)}
        >
          <option value="figureEight">Figure-Eight</option>
          <option value="binaryMerger">Binary Merger</option>
          <option value="randomCluster">Random Cluster</option>
          <option value="solarSystem">Solar System</option>
        </select>
      </div>

      {/* Integrator */}
      <div className="control-group">
        <label className="control-label">Integrator</label>
        <select
          id="select-integrator"
          className="select"
          value={integratorName}
          onChange={(e) => setIntegrator(e.target.value as IntegratorName)}
        >
          <option value="euler">Euler (1st order)</option>
          <option value="leapfrog">Leapfrog (symplectic)</option>
          <option value="rk4">RK4 (4th order)</option>
        </select>
      </div>

      {/* Force Solver */}
      <div className="control-group">
        <label className="control-label">Force Solver</label>
        <select
          id="select-force-solver"
          className="select"
          value={forceSolverName}
          onChange={(e) => setForceSolver(e.target.value as ForceSolverName)}
        >
          <option value="directSum">Direct Sum O(N²)</option>
          <option value="barnesHut">Barnes-Hut O(N log N)</option>
        </select>
      </div>
    </div>
  );
};

export default ControlPanel;
