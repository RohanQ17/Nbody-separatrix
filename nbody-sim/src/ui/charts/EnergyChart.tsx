import React, { useRef, useEffect } from 'react';
import { useSimStore } from '../../store';

/**
 * Canvas-drawn energy chart.
 * Shows KE (red), PE (blue), and Total (green) energy over time.
 * No external charting library needed.
 */
const EnergyChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energyHistory = useSimStore((s) => s.energyHistory);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 8, right: 8, bottom: 20, left: 50 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Clear
    ctx.fillStyle = '#111118';
    ctx.fillRect(0, 0, w, h);

    if (energyHistory.length < 2) {
      ctx.fillStyle = '#555';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Energy chart — waiting for data...', w / 2, h / 2);
      return;
    }

    // Compute range
    const data = energyHistory;
    let minE = Infinity,
      maxE = -Infinity;
    for (const snap of data) {
      const vals = [snap.kinetic, snap.potential, snap.total];
      for (const v of vals) {
        if (v < minE) minE = v;
        if (v > maxE) maxE = v;
      }
    }
    // Add padding
    const rangeE = maxE - minE || 1;
    minE -= rangeE * 0.05;
    maxE += rangeE * 0.05;

    const tMin = data[0].time;
    const tMax = data[data.length - 1].time;
    const tRange = tMax - tMin || 1;

    const toX = (t: number) => pad.left + ((t - tMin) / tRange) * plotW;
    const toY = (e: number) => pad.top + plotH - ((e - minE) / (maxE - minE)) * plotH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '9px Inter, monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = maxE - ((maxE - minE) * i) / 4;
      const y = pad.top + (plotH * i) / 4;
      ctx.fillText(val.toFixed(3), pad.left - 4, y + 3);
    }

    // Draw three lines
    const series: { key: 'kinetic' | 'potential' | 'total'; color: string }[] = [
      { key: 'kinetic', color: '#f87171' },
      { key: 'potential', color: '#60a5fa' },
      { key: 'total', color: '#34d399' },
    ];

    for (const { key, color } of series) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;

      for (let i = 0; i < data.length; i++) {
        const x = toX(data[i].time);
        const y = toY(data[i][key]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Legend
    ctx.font = '10px Inter, sans-serif';
    const legendY = h - 6;
    const labels = [
      { text: 'KE', color: '#f87171' },
      { text: 'PE', color: '#60a5fa' },
      { text: 'Total', color: '#34d399' },
    ];
    let lx = pad.left;
    for (const { text, color } of labels) {
      ctx.fillStyle = color;
      ctx.fillRect(lx, legendY - 6, 10, 3);
      ctx.fillStyle = '#999';
      ctx.textAlign = 'left';
      ctx.fillText(text, lx + 13, legendY);
      lx += ctx.measureText(text).width + 28;
    }
  }, [energyHistory]);

  return (
    <div className="panel-card">
      <h3 className="panel-title">Energy Over Time</h3>
      <canvas
        ref={canvasRef}
        id="energy-chart"
        style={{
          width: '100%',
          height: '140px',
          display: 'block',
          borderRadius: '6px',
        }}
      />
    </div>
  );
};

export default EnergyChart;
