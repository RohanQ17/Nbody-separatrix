/**
 * Simulation Web Worker — owns the physics clock.
 *
 * The worker runs the physics loop independently of the main thread.
 * Body data is posted back as Float64Array via Transferable (zero-copy).
 *
 * Protocol:
 *
 * Main → Worker:
 *   { type: 'init',           bodies: Body[], config? }
 *   { type: 'start' }
 *   { type: 'pause' }
 *   { type: 'reset',          bodies: Body[] }
 *   { type: 'setDt',          dt: number }
 *   { type: 'setIntegrator',  name: IntegratorName }
 *   { type: 'setForceSolver', name: ForceSolverName }
 *
 * Worker → Main:
 *   { type: 'frame', positions: Float64Array, velocities: Float64Array,
 *     masses: Float64Array, ids: Int32Array, n: number,
 *     time: number, energy: EnergySnapshot | null }
 *   (positions/velocities are Transferred — zero copy)
 */

import type {
  Body,
  IntegratorName,
  ForceSolverName,
  ForceSolver,
  Integrator,
  EnergySnapshot,
} from '../core/types';
import { DEFAULT_DT } from '../core/constants';
import { euler } from '../core/integrators/euler';
import { leapfrog } from '../core/integrators/leapfrog';
import { rk4 } from '../core/integrators/rk4';
import { directSum } from '../core/forces/directSum';
import { barnesHut } from '../core/forces/barnesHut';
import { energySnapshot } from '../core/analysis/energy';

// ─── State ──────────────────────────────────────────────────────

let bodies: Body[] = [];
let time = 0;
let dt = DEFAULT_DT;
let running = false;
let loopId: ReturnType<typeof setTimeout> | null = null;
let stepCount = 0;

const integrators: Record<IntegratorName, Integrator> = { euler, leapfrog, rk4 };
const forceSolvers: Record<ForceSolverName, ForceSolver> = { directSum, barnesHut };

let currentIntegrator: Integrator = leapfrog;
let currentForceSolver: ForceSolver = directSum;

// ─── Serialization ──────────────────────────────────────────────

/**
 * Pack bodies into Float64Arrays for zero-copy transfer.
 * Layout: [x0,y0,z0, x1,y1,z1, ...] — 3 doubles per body.
 */
function packFrame(
  bodies: Body[],
  time: number,
  energy: EnergySnapshot | null,
) {
  const n = bodies.length;
  const positions = new Float64Array(n * 3);
  const velocities = new Float64Array(n * 3);
  const masses = new Float64Array(n);
  const ids = new Int32Array(n);

  for (let i = 0; i < n; i++) {
    const b = bodies[i];
    const off = i * 3;
    positions[off] = b.position[0];
    positions[off + 1] = b.position[1];
    positions[off + 2] = b.position[2];
    velocities[off] = b.velocity[0];
    velocities[off + 1] = b.velocity[1];
    velocities[off + 2] = b.velocity[2];
    masses[i] = b.mass;
    ids[i] = b.id;
  }

  return { positions, velocities, masses, ids, n, time, energy };
}

function postFrame(energy: EnergySnapshot | null) {
  const frame = packFrame(bodies, time, energy);

  // Transfer the ArrayBuffers — zero copy to main thread
  self.postMessage(
    { type: 'frame', ...frame },
    {
      transfer: [
        frame.positions.buffer,
        frame.velocities.buffer,
        frame.masses.buffer,
        frame.ids.buffer,
      ],
    },
  );
}

// ─── Simulation loop ────────────────────────────────────────────

const STEPS_PER_BATCH = 16; // sub-steps between postMessage calls
const ENERGY_INTERVAL = 50; // sample energy every N steps

function loop(): void {
  if (!running) return;

  for (let i = 0; i < STEPS_PER_BATCH; i++) {
    bodies = currentIntegrator(bodies, dt, currentForceSolver);
    time += dt;
    stepCount++;
  }

  const energy =
    stepCount % ENERGY_INTERVAL < STEPS_PER_BATCH
      ? energySnapshot(bodies, time)
      : null;

  postFrame(energy);

  // Yield to allow incoming messages, then continue
  loopId = setTimeout(loop, 0);
}

function stopLoop() {
  running = false;
  if (loopId !== null) {
    clearTimeout(loopId);
    loopId = null;
  }
}

// ─── Message handler ────────────────────────────────────────────

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;

  switch (msg.type) {
    case 'init': {
      stopLoop();
      bodies = msg.bodies as Body[];
      time = 0;
      stepCount = 0;
      if (msg.config) {
        dt = msg.config.dt ?? dt;
        if (msg.config.integratorName) {
          currentIntegrator = integrators[msg.config.integratorName as IntegratorName];
        }
        if (msg.config.forceSolverName) {
          currentForceSolver = forceSolvers[msg.config.forceSolverName as ForceSolverName];
        }
      }
      // Send initial frame with energy
      postFrame(energySnapshot(bodies, time));
      break;
    }

    case 'start':
      if (!running) {
        running = true;
        loop();
      }
      break;

    case 'pause':
      stopLoop();
      break;

    case 'reset': {
      stopLoop();
      bodies = msg.bodies as Body[];
      time = 0;
      stepCount = 0;
      postFrame(energySnapshot(bodies, time));
      break;
    }

    case 'setDt':
      dt = msg.dt;
      break;

    case 'setIntegrator':
      currentIntegrator = integrators[msg.name as IntegratorName];
      break;

    case 'setForceSolver':
      currentForceSolver = forceSolvers[msg.name as ForceSolverName];
      break;

    default:
      console.warn('[sim.worker] Unknown message type:', msg.type);
  }
};
