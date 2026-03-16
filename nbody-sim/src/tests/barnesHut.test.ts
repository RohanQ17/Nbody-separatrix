import { describe, it, expect } from 'vitest';
import { directSum } from '../core/forces/directSum';
import { barnesHut } from '../core/forces/barnesHut';
import { randomCluster } from '../core/scenarios/randomCluster';

/**
 * Barnes-Hut accuracy test.
 *
 * Compares Barnes-Hut accelerations against the exact direct-sum
 * result on 50 randomly placed bodies. The relative error per-body
 * should be small (< 5% for typical configurations with θ = 0.5).
 */
describe('Barnes-Hut Accuracy', () => {
  it('should match direct-sum accelerations within 5% on 50 random bodies', () => {
    const bodies = randomCluster(50, 5, 12345);

    const accDirect = directSum(bodies);
    const accBH = barnesHut(bodies);

    let maxRelError = 0;
    let totalRelError = 0;

    for (let i = 0; i < bodies.length; i++) {
      const dx = accDirect[i][0] - accBH[i][0];
      const dy = accDirect[i][1] - accBH[i][1];
      const dz = accDirect[i][2] - accBH[i][2];
      const errMag = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const refMag = Math.sqrt(
        accDirect[i][0] ** 2 + accDirect[i][1] ** 2 + accDirect[i][2] ** 2,
      );

      const relError = refMag > 1e-10 ? errMag / refMag : 0;
      totalRelError += relError;
      if (relError > maxRelError) maxRelError = relError;
    }

    const avgRelError = totalRelError / bodies.length;

    console.log(`  Max relative error:  ${(maxRelError * 100).toFixed(4)}%`);
    console.log(`  Mean relative error: ${(avgRelError * 100).toFixed(4)}%`);

    expect(maxRelError).toBeLessThan(0.05); // < 5%
    expect(avgRelError).toBeLessThan(0.02); // < 2% mean
  });

  it('should handle edge cases: single body, two bodies', () => {
    const singleBody = [{ id: 0, mass: 1, position: [0, 0, 0] as [number, number, number], velocity: [0, 0, 0] as [number, number, number] }];
    const accSingle = barnesHut(singleBody);
    expect(accSingle[0][0]).toBe(0);
    expect(accSingle[0][1]).toBe(0);
    expect(accSingle[0][2]).toBe(0);

    const twoBodies = [
      { id: 0, mass: 1, position: [-1, 0, 0] as [number, number, number], velocity: [0, 0, 0] as [number, number, number] },
      { id: 1, mass: 1, position: [1, 0, 0] as [number, number, number], velocity: [0, 0, 0] as [number, number, number] },
    ];
    const accTwo = barnesHut(twoBodies);
    const accTwoDirect = directSum(twoBodies);

    // Should match exactly for 2 bodies (no approximation involved)
    for (let i = 0; i < 2; i++) {
      for (let d = 0; d < 3; d++) {
        expect(accTwo[i][d]).toBeCloseTo(accTwoDirect[i][d], 10);
      }
    }
  });

  it('should return empty array for empty input', () => {
    const acc = barnesHut([]);
    expect(acc).toHaveLength(0);
  });
});
