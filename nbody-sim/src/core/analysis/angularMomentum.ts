import type { Body, Vec3 } from '../types';
import { vec3Cross, vec3Scale, vec3Add, vec3Len, vec3Zero } from '../types';

/**
 * Angular momentum of a single body: L = m (r × v)
 */
export function bodyAngularMomentum(b: Body): Vec3 {
  return vec3Scale(vec3Cross(b.position, b.velocity), b.mass);
}

/**
 * Total angular momentum vector: L_total = Σ m_i (r_i × v_i)
 */
export function totalAngularMomentum(bodies: Body[]): Vec3 {
  let L: Vec3 = vec3Zero();
  for (const b of bodies) {
    L = vec3Add(L, bodyAngularMomentum(b));
  }
  return L;
}

/**
 * Scalar magnitude of total angular momentum: |L_total|
 */
export function totalAngularMomentumMag(bodies: Body[]): number {
  return vec3Len(totalAngularMomentum(bodies));
}
