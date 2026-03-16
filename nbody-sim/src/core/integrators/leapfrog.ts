import type { Body, Integrator, Vec3 } from '../types';

/**
 * Kick-Drift-Kick (KDK) Leapfrog integrator (2nd order, symplectic).
 *
 * 1. Half-kick:  v(t + dt/2)  = v(t)      + a(t)·dt/2
 * 2. Drift:      x(t + dt)    = x(t)      + v(t + dt/2)·dt
 * 3. Recompute:  a(t + dt)    = F(x(t+dt)) / m
 * 4. Half-kick:  v(t + dt)    = v(t+dt/2) + a(t+dt)·dt/2
 *
 * Being symplectic, this conserves a shadow Hamiltonian and keeps
 * energy error bounded and oscillatory rather than drifting.
 * This is the default integrator for the simulation.
 */
export const leapfrog: Integrator = (bodies, dt, forceSolver) => {
  const halfDt = dt * 0.5;

  // Step 1 — compute accelerations at current positions
  const acc0 = forceSolver(bodies);

  // Step 2 — half-kick + drift
  const drifted: Body[] = bodies.map((b, i) => {
    const a = acc0[i];
    // Half-kick velocity
    const vhx = b.velocity[0] + a[0] * halfDt;
    const vhy = b.velocity[1] + a[1] * halfDt;
    const vhz = b.velocity[2] + a[2] * halfDt;

    return {
      ...b,
      position: [
        b.position[0] + vhx * dt,
        b.position[1] + vhy * dt,
        b.position[2] + vhz * dt,
      ] as Vec3,
      velocity: [vhx, vhy, vhz] as Vec3,
    };
  });

  // Step 3 — recompute accelerations at new positions
  const acc1 = forceSolver(drifted);

  // Step 4 — second half-kick
  return drifted.map((b, i) => {
    const a = acc1[i];
    return {
      ...b,
      velocity: [
        b.velocity[0] + a[0] * halfDt,
        b.velocity[1] + a[1] * halfDt,
        b.velocity[2] + a[2] * halfDt,
      ] as Vec3,
    };
  });
};
