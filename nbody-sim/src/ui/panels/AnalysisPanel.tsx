import React from 'react';
import { useSimStore } from '../../store';

/**
 * Analysis panel showing current energy values and relative drift.
 */
const AnalysisPanel: React.FC = () => {
  const energyHistory = useSimStore((s) => s.energyHistory);

  const latest = energyHistory.length > 0 ? energyHistory[energyHistory.length - 1] : null;
  const initial = energyHistory.length > 0 ? energyHistory[0] : null;

  const drift =
    latest && initial && Math.abs(initial.total) > 1e-12
      ? ((latest.total - initial.total) / Math.abs(initial.total)) * 100
      : 0;

  const driftColor =
    Math.abs(drift) < 0.1 ? '#34d399' : Math.abs(drift) < 1 ? '#fbbf24' : '#f87171';

  return (
    <div className="panel-card">
      <h3 className="panel-title">Energy Analysis</h3>

      {latest ? (
        <>
          <div className="info-row">
            <span className="info-label">Kinetic</span>
            <span className="info-value" style={{ color: '#f87171' }}>
              {latest.kinetic.toFixed(6)}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Potential</span>
            <span className="info-value" style={{ color: '#60a5fa' }}>
              {latest.potential.toFixed(6)}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Total</span>
            <span className="info-value" style={{ color: '#34d399' }}>
              {latest.total.toFixed(6)}
            </span>
          </div>
          <div className="info-row" style={{ marginTop: '8px' }}>
            <span className="info-label">Energy Drift</span>
            <span className="info-value" style={{ color: driftColor, fontWeight: 600 }}>
              {drift.toFixed(4)}%
            </span>
          </div>
        </>
      ) : (
        <p className="info-placeholder">Run the simulation to see energy data</p>
      )}
    </div>
  );
};

export default AnalysisPanel;
