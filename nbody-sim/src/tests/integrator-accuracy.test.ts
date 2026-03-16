import { describe, it, expect } from 'vitest';
import { euler } from '../core/integrators/euler';
import { leapfrog } from '../core/integrators/leapfrog';
import { rk4 } from '../core/integrators/rk4';
import { directSum } from '../core/forces/directSum';
import { totalEnergy } from '../core/analysis/energy';
import type { Body, Vec3 } from '../core/types';

/**
 * Integrator accuracy comparison.
 *
 * Uses a simple 2-body circular orbit where the analytical solution is known.
 * Compares energy conservation across Euler, Leapfrog, and RK4.
 */

function twoBodyCircular(): Body[] {
  // Two equal masses in a circular orbit around their COM
  const m = 1;
  const r = 1; // distance from COM to each body
  // Circular orbit velocity: v = sqrt(G * m / (4 * r))  for equal masses at sep 2r
  const v = Math.sqrt(m / (4 * r)); // G=1

  return [
    { id: 0, mass: m, position: [-r, 0, 0] as Vec3, velocity: [0, -v, 0] as Vec3 },
    { id: 1, mass: m, position: [r, 0, 0] as Vec3, velocity: [0, v, 0] as Vec3 },
  ];
}

describe('Integrator Accuracy', () => {
  const dt = 0.001;
  const steps = 2000;

  it('RK4 should have less energy drift than Euler', () => {
    let bodiesEuler = twoBodyCircular();
    let bodiesRK4 = twoBodyCircular();

    const E0 = totalEnergy(bodiesEuler);

    for (let i = 0; i < steps; i++) {
      bodiesEuler = euler(bodiesEuler, dt, directSum);
      bodiesRK4 = rk4(bodiesRK4, dt, directSum);
    }

    const driftEuler = Math.abs((totalEnergy(bodiesEuler) - E0) / E0);
    const driftRK4 = Math.abs((totalEnergy(bodiesRK4) - E0) / E0);

    console.log(`  Euler drift: ${(driftEuler * 100).toFixed(6)}%`);
    console.log(`  RK4 drift:   ${(driftRK4 * 100).toFixed(6)}%`);

    expect(driftRK4).toBeLessThan(driftEuler);
  });

  it('Leapfrog should have less energy drift than Euler', () => {
    let bodiesEuler = twoBodyCircular();
    let bodiesLF = twoBodyCircular();

    const E0 = totalEnergy(bodiesEuler);

    for (let i = 0; i < steps; i++) {
      bodiesEuler = euler(bodiesEuler, dt, directSum);
      bodiesLF = leapfrog(bodiesLF, dt, directSum);
    }

    const driftEuler = Math.abs((totalEnergy(bodiesEuler) - E0) / E0);
    const driftLF = Math.abs((totalEnergy(bodiesLF) - E0) / E0);

    console.log(`  Euler drift:    ${(driftEuler * 100).toFixed(6)}%`);
    console.log(`  Leapfrog drift: ${(driftLF * 100).toFixed(6)}%`);

    expect(driftLF).toBeLessThan(driftEuler);
  });

  it('all integrators should maintain the orbit (bodies stay within bounds)', () => {
    const maxR = 5; // bodies should not fly off

    for (const [name, integrator] of [['euler', euler], ['leapfrog', leapfrog], ['rk4', rk4]] as const) {
      let bodies = twoBodyCircular();
      for (let i = 0; i < steps; i++) {
        bodies = integrator(bodies, dt, directSum);
      }

      for (const b of bodies) {
        const r = Math.sqrt(b.position[0] ** 2 + b.position[1] ** 2 + b.position[2] ** 2);
        expect(r, `${name}: body ${b.id} radius ${r} exceeded max`).toBeLessThan(maxR);
      }
    }
  });
});
