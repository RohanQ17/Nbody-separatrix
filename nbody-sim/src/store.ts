import { create } from 'zustand';
import type {
  Body,
  EnergySnapshot,
  IntegratorName,
  ForceSolverName,
  ScenarioName,
  Vec3,
} from './core/types';
import { DEFAULT_DT } from './core/constants';
import { figureEight } from './core/scenarios/figureEight';
import { binaryMerger } from './core/scenarios/binaryMerger';
import { randomCluster } from './core/scenarios/randomCluster';
import { solarSystem } from './core/scenarios/solarSystem';

// ─── Look-up maps ───────────────────────────────────────────────

export const scenarios: Record<ScenarioName, () => Body[]> = {
  figureEight,
  binaryMerger,
  randomCluster,
  solarSystem,
};

// ─── Store shape ────────────────────────────────────────────────

export interface SimStore {
  // ── Source-of-truth bodies (used for init / reset only) ──────
  bodies: Body[];

  // ── Double-buffered render state (updated from worker frames) ──
  renderBodies: Body[];
  renderTime: number;

  // ── Controls ──────────────────────────────────────────────────
  dt: number;
  running: boolean;
  integratorName: IntegratorName;
  forceSolverName: ForceSolverName;
  scenarioName: ScenarioName;

  // ── Energy history for charting ───────────────────────────────
  energyHistory: EnergySnapshot[];

  // ── Actions ───────────────────────────────────────────────────
  play: () => void;
  pause: () => void;
  toggleRunning: () => void;
  reset: () => void;
  setDt: (dt: number) => void;
  setIntegrator: (name: IntegratorName) => void;
  setForceSolver: (name: ForceSolverName) => void;
  setScenario: (name: ScenarioName) => void;
  pushEnergy: (snap: EnergySnapshot) => void;

  /**
   * Called by useSimLoop when a worker frame arrives.
   * Unpacks the Float64Arrays back into Body[] for rendering.
   */
  receiveFrame: (
    positions: Float64Array,
    velocities: Float64Array,
    masses: Float64Array,
    ids: Int32Array,
    n: number,
    time: number,
    energy: EnergySnapshot | null,
  ) => void;
}

const MAX_ENERGY_HISTORY = 2000;

/**
 * Unpack flat Float64Arrays back into Body[] for the renderer.
 */
function unpackBodies(
  positions: Float64Array,
  velocities: Float64Array,
  masses: Float64Array,
  ids: Int32Array,
  n: number,
): Body[] {
  const result: Body[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const off = i * 3;
    result[i] = {
      id: ids[i],
      mass: masses[i],
      position: [positions[off], positions[off + 1], positions[off + 2]] as Vec3,
      velocity: [velocities[off], velocities[off + 1], velocities[off + 2]] as Vec3,
    };
  }
  return result;
}

export const useSimStore = create<SimStore>((set, get) => {
  const initialBodies = figureEight();

  return {
    bodies: initialBodies,
    renderBodies: initialBodies,
    renderTime: 0,

    dt: DEFAULT_DT,
    running: false,

    integratorName: 'leapfrog',
    forceSolverName: 'directSum',
    scenarioName: 'figureEight',

    energyHistory: [],

    play: () => set({ running: true }),
    pause: () => set({ running: false }),
    toggleRunning: () => set((s) => ({ running: !s.running })),

    reset: () => {
      const state = get();
      const scenarioFn = scenarios[state.scenarioName];
      const newBodies = scenarioFn();
      set({
        bodies: newBodies,
        renderBodies: newBodies,
        renderTime: 0,
        running: false,
        energyHistory: [],
      });
    },

    setDt: (dt) => set({ dt }),
    setIntegrator: (name) => set({ integratorName: name }),
    setForceSolver: (name) => set({ forceSolverName: name }),

    setScenario: (name) => {
      const scenarioFn = scenarios[name];
      const newBodies = scenarioFn();
      set({
        scenarioName: name,
        bodies: newBodies,
        renderBodies: newBodies,
        renderTime: 0,
        running: false,
        energyHistory: [],
      });
    },

    pushEnergy: (snap) =>
      set((s) => {
        const h = [...s.energyHistory, snap];
        return {
          energyHistory:
            h.length > MAX_ENERGY_HISTORY
              ? h.slice(h.length - MAX_ENERGY_HISTORY)
              : h,
        };
      }),

    receiveFrame: (positions, velocities, masses, ids, n, time, energy) => {
      const renderBodies = unpackBodies(positions, velocities, masses, ids, n);

      set((s) => {
        let newHistory = s.energyHistory;
        if (energy) {
          newHistory = [...s.energyHistory, energy];
          if (newHistory.length > MAX_ENERGY_HISTORY) {
            newHistory = newHistory.slice(newHistory.length - MAX_ENERGY_HISTORY);
          }
        }

        return {
          renderBodies,
          renderTime: time,
          energyHistory: newHistory,
        };
      });
    },
  };
});
