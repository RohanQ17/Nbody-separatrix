import type { Body, Vec3 } from '../types';

/**
 * Simplified solar system scenario.
 *
 * Sun + 4 inner planets (Mercury–Mars) on circular orbits.
 * All values are in scaled / dimensionless units where G = 1.
 *
 * Mass ratios and orbital radii are approximately to scale;
 * velocities are set to v = √(G·M_sun / r) for circular orbits.
 */
export function solarSystem(): Body[] {
  const sunMass = 1000;

  const planets: { name: string; mass: number; r: number }[] = [
    { name: 'Mercury', mass: 0.055, r: 2.0 },
    { name: 'Venus', mass: 0.815, r: 3.5 },
    { name: 'Earth', mass: 1.0, r: 5.0 },
    { name: 'Mars', mass: 0.107, r: 7.5 },
  ];

  const bodies: Body[] = [
    {
      id: 0,
      mass: sunMass,
      position: [0, 0, 0] as Vec3,
      velocity: [0, 0, 0] as Vec3,
    },
  ];

  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    // Circular orbit velocity: v = sqrt(G * M_sun / r)
    const v = Math.sqrt(sunMass / p.r); // G = 1

    // Place planets at angle = i * (π/2) for visual spread
    const angle = (i * Math.PI) / 2;
    const px = p.r * Math.cos(angle);
    const py = p.r * Math.sin(angle);

    // Velocity perpendicular to position (counter-clockwise)
    const vx = -v * Math.sin(angle);
    const vy = v * Math.cos(angle);

    bodies.push({
      id: i + 1,
      mass: p.mass,
      position: [px, py, 0] as Vec3,
      velocity: [vx, vy, 0] as Vec3,
    });
  }

  // Adjust sun velocity so COM is at rest
  let comVx = 0,
    comVy = 0;
  let totalMass = 0;
  for (const b of bodies) {
    comVx += b.mass * b.velocity[0];
    comVy += b.mass * b.velocity[1];
    totalMass += b.mass;
  }
  for (const b of bodies) {
    b.velocity[0] -= comVx / totalMass;
    b.velocity[1] -= comVy / totalMass;
  }

  return bodies;
}
