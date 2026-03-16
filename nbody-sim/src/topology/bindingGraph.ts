/**
 * Binding graph — stub interface for EXT 5 (Topology classifier).
 *
 * In the base version, these interfaces are exported but unimplemented.
 * The full implementation will track gravitational binding between
 * body pairs and represent the N-body system as a weighted graph.
 */

import type { Vec3 } from '../core/types';

/** An edge in the binding graph representing a bound pair. */
export interface BindingEdge {
  /** Index of the first body. */
  i: number;
  /** Index of the second body. */
  j: number;
  /** Binding energy of the pair (negative = bound). */
  bindingEnergy: number;
  /** Separation vector. */
  separation: Vec3;
}

/** The binding graph for the full N-body system. */
export interface BindingGraph {
  /** All bound pairs. */
  edges: BindingEdge[];
  /** Number of bodies in the system. */
  bodyCount: number;
  /** Number of bound sub-systems (connected components). */
  componentCount: number;
}
