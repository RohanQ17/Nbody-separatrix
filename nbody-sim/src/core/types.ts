// ─── Primitive types ────────────────────────────────────────────
export type Vec3 = [number, number, number];

// ─── Body ───────────────────────────────────────────────────────
export interface Body {
  id: number;
  mass: number;
  position: Vec3;
  velocity: Vec3;
}

// ─── Simulation state ───────────────────────────────────────────
export interface SimState {
  bodies: Body[];
  time: number;
  dt: number;
}

// ─── Function signatures ────────────────────────────────────────
/** Returns an array of acceleration vectors, one per body. */
export type ForceSolver = (bodies: Body[]) => Vec3[];

/** Advances bodies by dt using the given force solver. Returns new body array. */
export type Integrator = (
  bodies: Body[],
  dt: number,
  forceSolver: ForceSolver,
) => Body[];

// ─── Named unions ───────────────────────────────────────────────
export type IntegratorName = 'euler' | 'leapfrog' | 'rk4';
export type ForceSolverName = 'directSum' | 'barnesHut';
export type ScenarioName =
  | 'figureEight'
  | 'binaryMerger'
  | 'randomCluster'
  | 'solarSystem';

// ─── Energy snapshot ────────────────────────────────────────────
export interface EnergySnapshot {
  time: number;
  kinetic: number;
  potential: number;
  total: number;
}

// ─── Vec3 helpers ───────────────────────────────────────────────
export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vec3Scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function vec3Dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function vec3LenSq(v: Vec3): number {
  return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
}

export function vec3Len(v: Vec3): number {
  return Math.sqrt(vec3LenSq(v));
}

export function vec3Zero(): Vec3 {
  return [0, 0, 0];
}
