import { useEffect, useRef } from 'react';
import { useSimStore } from '../../store';

/**
 * React hook that spawns the simulation Web Worker and wires messages.
 *
 * The worker owns the physics clock. This hook only:
 *   1. Spawns the worker on mount
 *   2. Sends commands (start/pause/reset/setDt/setIntegrator/setForceSolver)
 *   3. Receives frames and calls store.receiveFrame()
 *
 * Physics and rendering are fully decoupled — the worker posts frames
 * as fast as physics allows; the renderer picks up the latest state
 * at its own rAF rate.
 */
export function useSimLoop() {
  const workerRef = useRef<Worker | null>(null);

  // Subscribe to store changes that need to be forwarded to the worker
  const running = useSimStore((s) => s.running);
  const dt = useSimStore((s) => s.dt);
  const integratorName = useSimStore((s) => s.integratorName);
  const forceSolverName = useSimStore((s) => s.forceSolverName);
  const scenarioName = useSimStore((s) => s.scenarioName);
  const bodies = useSimStore((s) => s.bodies);
  const receiveFrame = useSimStore((s) => s.receiveFrame);

  // ── Spawn worker on mount ────────────────────────────────────
  useEffect(() => {
    const worker = new Worker(
      new URL('../../workers/sim.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'frame') {
        receiveFrame(
          msg.positions,
          msg.velocities,
          msg.masses,
          msg.ids,
          msg.n,
          msg.time,
          msg.energy,
        );
      }
    };

    worker.onerror = (err) => {
      console.error('[useSimLoop] Worker error:', err);
    };

    // Send initial bodies to the worker
    const state = useSimStore.getState();
    worker.postMessage({
      type: 'init',
      bodies: state.bodies,
      config: {
        dt: state.dt,
        integratorName: state.integratorName,
        forceSolverName: state.forceSolverName,
      },
    });

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only

  // ── Forward running state ────────────────────────────────────
  useEffect(() => {
    const w = workerRef.current;
    if (!w) return;
    w.postMessage({ type: running ? 'start' : 'pause' });
  }, [running]);

  // ── Forward dt changes ───────────────────────────────────────
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'setDt', dt });
  }, [dt]);

  // ── Forward integrator changes ───────────────────────────────
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'setIntegrator', name: integratorName });
  }, [integratorName]);

  // ── Forward force solver changes ─────────────────────────────
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'setForceSolver', name: forceSolverName });
  }, [forceSolverName]);

  // ── Forward scenario / reset ─────────────────────────────────
  // When bodies change (via reset or scenario switch), re-init the worker
  useEffect(() => {
    const w = workerRef.current;
    if (!w) return;
    w.postMessage({
      type: 'reset',
      bodies,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioName]); // bodies ref changes on scenario change
}
