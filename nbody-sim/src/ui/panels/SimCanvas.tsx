import React, { useRef, useEffect } from 'react';
import { useSimStore } from '../../store';
import { Canvas2DRenderer } from '../../renderer/Canvas2DRenderer';

/**
 * Main simulation viewport canvas.
 * Uses Canvas2DRenderer for the base version (CPU sim path).
 */
const SimCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Canvas2DRenderer | null>(null);
  const bodies = useSimStore((s) => s.renderBodies);

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new Canvas2DRenderer(canvas);
    rendererRef.current = renderer;

    // Initial resize
    const handleResize = () => renderer.resize();
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Render on body updates
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.render(bodies);
    }
  }, [bodies]);

  return (
    <canvas
      ref={canvasRef}
      id="sim-canvas"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: '#0a0a0f',
        borderRadius: '12px',
      }}
    />
  );
};

export default SimCanvas;
