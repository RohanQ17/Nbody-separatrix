import type { Body, Integrator, Vec3 } from '../types';

/**
 * Classical 4th-order Runge-Kutta integrator.
 *
 * Uses four force evaluations per step (k1–k4) to achieve O(dt⁴) local
 * truncation error. Not symplectic, so energy will slowly drift, but
 * the accuracy per step is much higher than Euler or Leapfrog.
 *
 * Serves as the reference comparator for accuracy tests.
 */
export const rk4: Integrator = (bodies, dt, forceSolver) => {
  const n = bodies.length;
  const halfDt = dt * 0.5;

  // ── Helper: build a Body[] with offset positions and velocities ──
  function offsetBodies(
    base: Body[],
    dxArr: Vec3[],
    dvArr: Vec3[],
    scale: number,
  ): Body[] {
    return base.map((b, i) => ({
      ...b,
      position: [
        b.position[0] + dxArr[i][0] * scale,
        b.position[1] + dxArr[i][1] * scale,
        b.position[2] + dxArr[i][2] * scale,
      ] as Vec3,
      velocity: [
        b.velocity[0] + dvArr[i][0] * scale,
        b.velocity[1] + dvArr[i][1] * scale,
        b.velocity[2] + dvArr[i][2] * scale,
      ] as Vec3,
    }));
  }

  // k1
  const a1 = forceSolver(bodies);
  const k1x: Vec3[] = bodies.map((b) => [...b.velocity] as Vec3);
  const k1v: Vec3[] = a1;

  // k2 — evaluate at t + dt/2 using k1
  const b2 = offsetBodies(bodies, k1x, k1v, halfDt);
  const a2 = forceSolver(b2);
  const k2x: Vec3[] = b2.map((b) => [...b.velocity] as Vec3);
  const k2v: Vec3[] = a2;

  // k3 — evaluate at t + dt/2 using k2
  const b3 = offsetBodies(bodies, k2x, k2v, halfDt);
  const a3 = forceSolver(b3);
  const k3x: Vec3[] = b3.map((b) => [...b.velocity] as Vec3);
  const k3v: Vec3[] = a3;

  // k4 — evaluate at t + dt using k3
  const b4 = offsetBodies(bodies, k3x, k3v, dt);
  const a4 = forceSolver(b4);
  const k4x: Vec3[] = b4.map((b) => [...b.velocity] as Vec3);
  const k4v: Vec3[] = a4;

  // Combine: y(t+dt) = y(t) + (dt/6)(k1 + 2k2 + 2k3 + k4)
  const dt6 = dt / 6;

  return bodies.map((b, i) => ({
    ...b,
    position: [
      b.position[0] + dt6 * (k1x[i][0] + 2 * k2x[i][0] + 2 * k3x[i][0] + k4x[i][0]),
      b.position[1] + dt6 * (k1x[i][1] + 2 * k2x[i][1] + 2 * k3x[i][1] + k4x[i][1]),
      b.position[2] + dt6 * (k1x[i][2] + 2 * k2x[i][2] + 2 * k3x[i][2] + k4x[i][2]),
    ] as Vec3,
    velocity: [
      b.velocity[0] + dt6 * (k1v[i][0] + 2 * k2v[i][0] + 2 * k3v[i][0] + k4v[i][0]),
      b.velocity[1] + dt6 * (k1v[i][1] + 2 * k2v[i][1] + 2 * k3v[i][1] + k4v[i][1]),
      b.velocity[2] + dt6 * (k1v[i][2] + 2 * k2v[i][2] + 2 * k3v[i][2] + k4v[i][2]),
    ] as Vec3,
  }));
};
