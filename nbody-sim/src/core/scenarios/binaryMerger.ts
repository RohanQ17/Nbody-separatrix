import type { Body, Vec3 } from '../types';

/**
 * Binary merger scenario.
 *
 * Two massive bodies on an elliptical close-approach trajectory,
 * plus an optional lighter perturber orbiting wide.
 * This is representative of binary star or black-hole merger setups.
 */
export function binaryMerger(): Body[] {
  // Two heavy bodies approaching each other
  const m1 = 10;
  const m2 = 10;

  // Separation ≈ 2 units, relative velocity gives eccentricity ~ 0.5
  const bodies: Body[] = [
    {
      id: 0,
      mass: m1,
      position: [-1, 0, 0] as Vec3,
      velocity: [0, 0.5, 0] as Vec3,
    },
    {
      id: 1,
      mass: m2,
      position: [1, 0, 0] as Vec3,
      velocity: [0, -0.5, 0] as Vec3,
    },
    // Lighter perturber on a wider orbit
    {
      id: 2,
      mass: 1,
      position: [5, 5, 0] as Vec3,
      velocity: [-0.3, 0.2, 0] as Vec3,
    },
  ];

  return bodies;
}
