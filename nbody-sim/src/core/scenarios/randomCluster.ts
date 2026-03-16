import type { Body, Vec3 } from '../types';

/**
 * Random cluster scenario.
 *
 * Generates `n` bodies uniformly distributed in a sphere of given radius,
 * with Gaussian-distributed velocities (virial-ish scaling).
 *
 * Uses a simple Marsaglia method for uniform-in-sphere sampling.
 */

/** Simple deterministic PRNG (xorshift32) for reproducibility. */
function xorshift32(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff; // [0, 1)
  };
}

/** Box-Muller transform for Gaussian samples. */
function gaussianPair(rand: () => number): [number, number] {
  const u1 = rand() || 1e-10;
  const u2 = rand();
  const r = Math.sqrt(-2 * Math.log(u1));
  const theta = 2 * Math.PI * u2;
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

export function randomCluster(n = 20, radius = 5, seed = 42): Body[] {
  const rand = xorshift32(seed);
  const bodies: Body[] = [];

  // Velocity dispersion — rough virial scaling
  const sigma = 0.3;

  for (let i = 0; i < n; i++) {
    // Uniform point in a sphere (rejection sampling)
    let x: number, y: number, z: number;
    do {
      x = (rand() * 2 - 1) * radius;
      y = (rand() * 2 - 1) * radius;
      z = (rand() * 2 - 1) * radius;
    } while (x * x + y * y + z * z > radius * radius);

    // Gaussian velocity
    const [vx, vy] = gaussianPair(rand);
    const [vz] = gaussianPair(rand);

    bodies.push({
      id: i,
      mass: 0.5 + rand() * 1.5, // mass in [0.5, 2.0]
      position: [x, y, z] as Vec3,
      velocity: [vx * sigma, vy * sigma, vz * sigma] as Vec3,
    });
  }

  // Shift to centre-of-mass frame
  let totalMass = 0;
  const comPos: Vec3 = [0, 0, 0];
  const comVel: Vec3 = [0, 0, 0];

  for (const b of bodies) {
    totalMass += b.mass;
    comPos[0] += b.mass * b.position[0];
    comPos[1] += b.mass * b.position[1];
    comPos[2] += b.mass * b.position[2];
    comVel[0] += b.mass * b.velocity[0];
    comVel[1] += b.mass * b.velocity[1];
    comVel[2] += b.mass * b.velocity[2];
  }

  for (const b of bodies) {
    b.position[0] -= comPos[0] / totalMass;
    b.position[1] -= comPos[1] / totalMass;
    b.position[2] -= comPos[2] / totalMass;
    b.velocity[0] -= comVel[0] / totalMass;
    b.velocity[1] -= comVel[1] / totalMass;
    b.velocity[2] -= comVel[2] / totalMass;
  }

  return bodies;
}
