import { describe, it, expect } from 'vitest';
import { figureEight } from '../core/scenarios/figureEight';
import { leapfrog } from '../core/integrators/leapfrog';
import { euler } from '../core/integrators/euler';
import { directSum } from '../core/forces/directSum';
import { totalEnergy } from '../core/analysis/energy';

/**
 * Energy conservation test — MUST-PASS GATE.
 *
 * Runs the figure-eight scenario with the leapfrog integrator
 * and asserts that total energy drift stays below 0.1%.
 */
describe('Energy Conservation', () => {
  it('leapfrog should conserve energy to < 0.1% over 1000 steps on figure-eight', () => {
    let bodies = figureEight();
    const dt = 0.001;
    const steps = 1000;

    const E0 = totalEnergy(bodies);

    for (let i = 0; i < steps; i++) {
      bodies = leapfrog(bodies, dt, directSum);
    }

    const E1 = totalEnergy(bodies);
    const drift = Math.abs((E1 - E0) / E0);

    console.log(`  Initial energy: ${E0.toFixed(8)}`);
    console.log(`  Final energy:   ${E1.toFixed(8)}`);
    console.log(`  Relative drift: ${(drift * 100).toFixed(6)}%`);

    expect(drift).toBeLessThan(0.001); // < 0.1%
  });

  it('euler should show significant energy drift (baseline comparison)', () => {
    // This test demonstrates WHY we use symplectic integrators
    let bodies = figureEight();
    const dt = 0.001;
    const steps = 1000;

    const E0 = totalEnergy(bodies);

    for (let i = 0; i < steps; i++) {
      bodies = euler(bodies, dt, directSum);
    }

    const E1 = totalEnergy(bodies);
    const drift = Math.abs((E1 - E0) / E0);

    console.log(`  Euler drift: ${(drift * 100).toFixed(6)}%`);

    // Euler should have measurably more drift than leapfrog
    expect(drift).toBeGreaterThan(0.00001); // > 0.001%
  });
});
