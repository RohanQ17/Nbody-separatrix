# N-Body Gravitational Simulator — Architecture & Features

## Overview

A browser-based N-body gravitational simulation built with **React + TypeScript + Vite**. The simulation runs CPU-side physics via a synchronous rAF loop (with Web Worker scaffolding ready), renders through **Canvas2D** (with WebGPU scaffolding), and provides real-time energy analysis charting.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 8 (ES modules, WGSL import, worker support) |
| State | Zustand 5 (single store, selector-based reactivity) |
| Rendering | Canvas2D (primary), WebGPU (scaffolded) |
| Testing | Vitest 4 |
| GPU Types | `@webgpu/types` (WebGPU global type definitions) |

---

## Project Structure

```
nbody-sim/
├── src/
│   ├── core/               # Zero UI deps — pure physics
│   │   ├── types.ts         # Vec3, Body, SimState, Integrator, ForceSolver
│   │   ├── constants.ts     # G, softening ε, default dt, BH θ
│   │   ├── integrators/     # Time-stepping algorithms
│   │   │   ├── euler.ts     # 1st-order forward Euler
│   │   │   ├── leapfrog.ts  # 2nd-order symplectic KDK (default)
│   │   │   └── rk4.ts       # 4th-order Runge-Kutta
│   │   ├── forces/          # Gravitational force solvers
│   │   │   ├── directSum.ts # O(N²) exact pairwise
│   │   │   └── barnesHut.ts # O(N log N) octree approximation
│   │   ├── analysis/        # Conservation diagnostics
│   │   │   ├── energy.ts    # KE, PE, total energy, snapshots
│   │   │   └── angularMomentum.ts
│   │   └── scenarios/       # Initial condition generators
│   │       ├── figureEight.ts   # Chenciner-Montgomery choreography
│   │       ├── binaryMerger.ts  # Two massive bodies + perturber
│   │       ├── randomCluster.ts # N random bodies (deterministic PRNG)
│   │       └── solarSystem.ts   # Sun + 4 inner planets
│   ├── gpu/                 # WebGPU scaffolding
│   │   ├── device.ts        # Adapter/device acquisition + fallback
│   │   ├── buffers.ts       # SoA GPU buffer management
│   │   ├── pipeline.ts      # Compute pipeline setup
│   │   └── shaders/
│   │       ├── gravity.wgsl  # All-pairs gravity compute kernel
│   │       ├── integrate.wgsl# Leapfrog KDK kernel
│   │       └── render.wgsl   # Particle billboard render pass
│   ├── renderer/
│   │   ├── Canvas2DRenderer.ts # Pan/zoom camera, trails, glow effects
│   │   ├── WebGPURenderer.ts   # WebGPU scaffolding (clears screen)
│   │   └── trailBuffer.ts     # Ring buffer for orbit trails
│   ├── workers/
│   │   └── sim.worker.ts    # Web Worker sim loop (scaffolded)
│   ├── ui/
│   │   ├── panels/
│   │   │   ├── SimCanvas.tsx    # Main viewport
│   │   │   ├── ControlPanel.tsx # Play/pause, dt, dropdowns
│   │   │   └── AnalysisPanel.tsx# Live energy readout + drift %
│   │   ├── charts/
│   │   │   └── EnergyChart.tsx  # Canvas-drawn KE/PE/Total chart
│   │   └── hooks/
│   │       ├── useSimLoop.ts    # rAF loop (16 sub-steps/frame)
│   │       └── useGPUDevice.ts  # WebGPU device hook
│   ├── topology/            # Stubs for EXT 5
│   │   ├── bindingGraph.ts
│   │   └── encounterDetector.ts
│   ├── store.ts             # Zustand store
│   ├── App.tsx              # Root layout
│   ├── main.tsx             # Entry point + WebGPU detection
│   └── index.css            # Full dark theme
└── tests/
    ├── energy-conservation.test.ts  # Must-pass gate
    ├── integrator-accuracy.test.ts  # Euler vs Leapfrog vs RK4
    └── barnesHut.test.ts            # Octree vs direct sum accuracy
```

---

## Current Features

### Physics Engine

- **3 integrators** — selectable at runtime:
  - **Euler** — 1st order, non-symplectic (debug baseline)
  - **Leapfrog (KDK)** — 2nd order, symplectic (default) — bounded oscillatory energy error
  - **RK4** — 4th order, non-symplectic — highest per-step accuracy
- **2 force solvers** — selectable at runtime:
  - **Direct Sum** — O(N²) exact pairwise with softening and Newton's 3rd law optimization
  - **Barnes-Hut** — O(N log N) octree with θ = 0.5 opening angle
- **Softened gravity** — ε = 0.01 prevents singularities at close approach
- **Dimensionless units** — G = 1, masses and distances are in natural units

### Scenarios

| Scenario | Bodies | Description |
|----------|--------|-------------|
| Figure-Eight | 3 | Chenciner-Montgomery choreographic solution |
| Binary Merger | 3 | Two heavy bodies + lighter perturber |
| Random Cluster | 20 | Gaussian velocities, COM-centered, deterministic seed |
| Solar System | 5 | Sun + Mercury–Mars on circular orbits |

### Rendering

- **Canvas2D fallback** — always works, no GPU required
- Pan (click-drag) and zoom (mouse wheel) camera
- Mass-proportional body sizing with radial glow effect
- Orbit trails via 512-element ring buffer with fading
- Adaptive background grid
- Color palette per body

### UI

- **Control Panel** — play/pause, reset, log-scale dt slider, integrator/force-solver/scenario dropdowns
- **Analysis Panel** — live KE, PE, total energy readout with drift % (color-coded: green < 0.1%, amber < 1%, red > 1%)
- **Energy Chart** — real-time canvas-drawn line chart (KE red, PE blue, Total green) with auto-scaling axes

### State Management

- **Zustand** single store with selectors — bodies, time, dt, running flag, module names, energy history
- Energy sampled every 10th tick to avoid history bloat (max 2000 snapshots)

---

## Configuration

### `vite.config.ts`
- `@vitejs/plugin-react` for JSX transform
- `@` path alias → `src/`
- `worker.format: 'es'` for ES module workers
- `assetsInclude: ['**/*.wgsl']` for WGSL shader imports

### `tsconfig.app.json`
- Target: ES2023
- Strict mode with all lint checks enabled
- Path alias: `@/*` → `src/*`
- Types: `vite/client` + `@webgpu/types`

---

## Tests (8/8 passing)

| Suite | Tests | What it validates |
|-------|-------|-------------------|
| `energy-conservation` | 2 | Leapfrog drift < 0.1% on figure-eight (1000 steps); Euler shows measurable drift |
| `integrator-accuracy` | 3 | RK4 < Euler drift; Leapfrog < Euler drift; all stay bounded |
| `barnesHut` | 3 | Max error < 5% vs direct sum on 50 bodies; edge cases (0, 1, 2 bodies) |

---

## What's Stubbed (for later extensions)

- `topology/bindingGraph.ts` — interfaces only (EXT 5: Topology classifier)
- `topology/encounterDetector.ts` — interfaces only (EXT 5: Topology classifier)
- `renderer/WebGPURenderer.ts` — configures context + clears screen (full particle pipeline deferred)
- `workers/sim.worker.ts` — complete but not wired to UI (the rAF loop in `useSimLoop` runs sync on main thread)
