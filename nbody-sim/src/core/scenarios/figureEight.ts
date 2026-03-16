import type { Body, Vec3 } from '../types';

/**
 * Chenciner-Montgomery figure-eight solution for three equal-mass bodies.
 *
 * Published initial conditions (Šuvakov & Dmitrašinović, 2013):
 * Three bodies of mass 1 follow a figure-eight curve in the x-y plane.
 * This is one of the most famous choreographic solutions to the 3-body problem.
 *
 * The ICs are given in the centre-of-mass frame so Σ m·r = 0 and Σ m·v = 0.
 */
export function figureEight(): Body[] {
  // Positions
  const x1: Vec3 = [-0.97000436, 0.24308753, 0];
  const x2: Vec3 = [0, 0, 0]; // at origin (COM constraint)
  const x3: Vec3 = [0.97000436, -0.24308753, 0];

  // Velocities — body 2 has the negative sum of v1 and v3
  const v3: Vec3 = [-0.93240737 / 2, -0.86473146 / 2, 0];
  const v1: Vec3 = [-0.93240737 / 2, -0.86473146 / 2, 0];
  const v2: Vec3 = [0.93240737, 0.86473146, 0];

  return [
    { id: 0, mass: 1, position: x1, velocity: v1 },
    { id: 1, mass: 1, position: x2, velocity: v2 },
    { id: 2, mass: 1, position: x3, velocity: v3 },
  ];
}
