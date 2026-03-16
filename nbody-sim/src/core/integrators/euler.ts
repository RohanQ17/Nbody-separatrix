import type { Body, Integrator, Vec3 } from '../types';

/**
 * Simple forward-Euler integrator (1st order).
 *
 *   v(t+dt) = v(t) + a(t)·dt
 *   x(t+dt) = x(t) + v(t+dt)·dt
 *
 * This is the simplest possible integrator and serves as a debug baseline.
 * It is NOT symplectic and will accumulate energy error quickly.
 */
export const euler: Integrator = (bodies, dt, forceSolver) => {
  const acc = forceSolver(bodies);

  return bodies.map((b, i) => {
    const a = acc[i];
    const vx = b.velocity[0] + a[0] * dt;
    const vy = b.velocity[1] + a[1] * dt;
    const vz = b.velocity[2] + a[2] * dt;

    return {
      ...b,
      velocity: [vx, vy, vz] as Vec3,
      position: [
        b.position[0] + vx * dt,
        b.position[1] + vy * dt,
        b.position[2] + vz * dt,
      ] as Vec3,
    };
  });
};
