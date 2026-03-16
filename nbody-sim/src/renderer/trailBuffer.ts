import type { Vec3 } from '../core/types';
import { MAX_TRAIL_LENGTH } from '../core/constants';

/**
 * Ring buffer that stores the last N positions for each body.
 * Used to render orbit trails.
 */
export class TrailBuffer {
  /** Number of bodies being tracked. */
  readonly bodyCount: number;

  /** Maximum number of positions stored per body. */
  readonly maxLength: number;

  /**
   * Storage: bodyCount arrays, each maxLength vec3s.
   * trails[bodyIndex][ring position] = Vec3
   */
  private trails: Vec3[][];

  /** Current write index in the ring (same for all bodies). */
  private head = 0;

  /** Number of positions stored so far (grows until maxLength). */
  private count = 0;

  constructor(bodyCount: number, maxLength: number = MAX_TRAIL_LENGTH) {
    this.bodyCount = bodyCount;
    this.maxLength = maxLength;
    this.trails = Array.from({ length: bodyCount }, () =>
      Array.from({ length: maxLength }, (): Vec3 => [0, 0, 0]),
    );
  }

  /**
   * Push the current positions of all bodies into the ring buffer.
   * @param positions Array of Vec3, one per body (must match bodyCount).
   */
  push(positions: Vec3[]): void {
    for (let i = 0; i < this.bodyCount; i++) {
      const p = positions[i];
      this.trails[i][this.head] = [p[0], p[1], p[2]];
    }
    this.head = (this.head + 1) % this.maxLength;
    if (this.count < this.maxLength) this.count++;
  }

  /**
   * Get the trail for a specific body as an ordered array
   * (oldest → newest).
   */
  getTrail(bodyIndex: number): Vec3[] {
    const trail = this.trails[bodyIndex];
    const result: Vec3[] = [];
    const start = this.count < this.maxLength ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      result.push(trail[(start + i) % this.maxLength]);
    }
    return result;
  }

  /** Number of stored positions per body. */
  get length(): number {
    return this.count;
  }

  /** Reset the buffer. */
  clear(): void {
    this.head = 0;
    this.count = 0;
  }
}
