/**
 * Gravitational constant — set to 1 for dimensionless / normalized units.
 * Real-world scenarios can scale masses and distances accordingly.
 */
export const G = 1;

/**
 * Softening parameter (ε).
 * Prevents the force from diverging when two bodies come very close.
 * The force denominator uses (|r|² + ε²) instead of |r|².
 */
export const SOFTENING = 0.01;

/** Squared softening — pre-computed to avoid repeated multiplication. */
export const SOFTENING_SQ = SOFTENING * SOFTENING;

/** Default simulation timestep. */
export const DEFAULT_DT = 0.001;

/** Maximum trail length for the ring buffer (number of stored positions per body). */
export const MAX_TRAIL_LENGTH = 512;

/** Default Barnes-Hut opening angle θ. */
export const BH_THETA = 0.5;
