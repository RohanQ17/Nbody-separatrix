/**
 * Encounter detector — stub interface for EXT 5 (Topology classifier).
 *
 * In the base version, these interfaces are exported but unimplemented.
 * The full implementation will detect close encounters between bodies
 * and classify them as flybys, captures, or exchanges.
 */

/** A detected close encounter event. */
export interface EncounterEvent {
  /** Simulation time of the encounter. */
  time: number;
  /** Indices of the bodies involved. */
  bodies: number[];
  /** Minimum separation distance reached. */
  minSeparation: number;
  /** Relative velocity at closest approach. */
  relativeVelocity: number;
}

/** Interface for an encounter detector (to be implemented in EXT 5). */
export interface EncounterDetector {
  /** Check current state for new encounters. */
  // detect(bodies: Body[], dt: number): EncounterEvent[];
  /** Get all encounters detected so far. */
  // getHistory(): EncounterEvent[];
  /** Reset the detector. */
  // reset(): void;
}
