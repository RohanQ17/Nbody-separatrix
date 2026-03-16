import type { Body, ForceSolver, Vec3 } from '../types';
import { G, SOFTENING_SQ } from '../constants';

/**
 * O(N²) direct-sum gravitational force solver.
 *
 * For each pair (i, j) computes:
 *   a_i += G · m_j · (r_j − r_i) / (|r_j − r_i|² + ε²)^(3/2)
 *
 * Uses Newton's third law to halve the work: the force on j from i
 * is the negative of the force on i from j.
 */
export const directSum: ForceSolver = (bodies: Body[]): Vec3[] => {
  const n = bodies.length;
  const acc: Vec3[] = Array.from({ length: n }, () => [0, 0, 0] as Vec3);

  for (let i = 0; i < n; i++) {
    const pi = bodies[i].position;

    for (let j = i + 1; j < n; j++) {
      const pj = bodies[j].position;

      // Displacement vector r_ij = pj − pi
      const dx = pj[0] - pi[0];
      const dy = pj[1] - pi[1];
      const dz = pj[2] - pi[2];

      // |r_ij|² + ε²
      const distSq = dx * dx + dy * dy + dz * dz + SOFTENING_SQ;
      // 1 / |r_ij|³  (softened)
      const invDist3 = G / (distSq * Math.sqrt(distSq));

      // Force magnitude factors
      const fj = bodies[j].mass * invDist3; // contribution to acc[i]
      const fi = bodies[i].mass * invDist3; // contribution to acc[j]

      acc[i][0] += fj * dx;
      acc[i][1] += fj * dy;
      acc[i][2] += fj * dz;

      acc[j][0] -= fi * dx;
      acc[j][1] -= fi * dy;
      acc[j][2] -= fi * dz;
    }
  }

  return acc;
};
