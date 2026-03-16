import type { Body, Vec3, EnergySnapshot } from '../types';
import { vec3LenSq } from '../types';
import { G, SOFTENING_SQ } from '../constants';

/**
 * Total kinetic energy:  KE = Σ ½ m |v|²
 */
export function kineticEnergy(bodies: Body[]): number {
  let ke = 0;
  for (const b of bodies) {
    ke += 0.5 * b.mass * vec3LenSq(b.velocity);
  }
  return ke;
}

/**
 * Total gravitational potential energy (softened):
 *   PE = − Σ_{i<j} G m_i m_j / √(|r_i − r_j|² + ε²)
 */
export function potentialEnergy(bodies: Body[]): number {
  let pe = 0;
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    const pi = bodies[i].position;
    const mi = bodies[i].mass;
    for (let j = i + 1; j < n; j++) {
      const pj = bodies[j].position;
      const dx = pj[0] - pi[0];
      const dy = pj[1] - pi[1];
      const dz = pj[2] - pi[2];
      const distSq = dx * dx + dy * dy + dz * dz + SOFTENING_SQ;
      pe -= (G * mi * bodies[j].mass) / Math.sqrt(distSq);
    }
  }
  return pe;
}

/**
 * Total energy = KE + PE.
 * Should be approximately conserved for symplectic integrators.
 */
export function totalEnergy(bodies: Body[]): number {
  return kineticEnergy(bodies) + potentialEnergy(bodies);
}

/**
 * Build a full energy snapshot for the given bodies at a given time.
 */
export function energySnapshot(bodies: Body[], time: number): EnergySnapshot {
  const kinetic = kineticEnergy(bodies);
  const potential = potentialEnergy(bodies);
  return {
    time,
    kinetic,
    potential,
    total: kinetic + potential,
  };
}
