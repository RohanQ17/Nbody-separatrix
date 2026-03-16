import type { Body, ForceSolver, Vec3 } from '../types';
import { G, SOFTENING_SQ, BH_THETA } from '../constants';

// ─── Octree Node ────────────────────────────────────────────────

interface OctreeNode {
  // Centre-of-mass quantities
  cx: number;
  cy: number;
  cz: number;
  totalMass: number;

  // Bounding box
  ox: number; // origin x
  oy: number;
  oz: number;
  size: number; // half-width

  // Children (8 octants) — null if leaf
  children: (OctreeNode | null)[] | null;

  // If this is a leaf, the body index (-1 if empty)
  bodyIndex: number;
}

function createNode(
  ox: number,
  oy: number,
  oz: number,
  size: number,
): OctreeNode {
  return {
    cx: 0,
    cy: 0,
    cz: 0,
    totalMass: 0,
    ox,
    oy,
    oz,
    size,
    children: null,
    bodyIndex: -1,
  };
}

/** Determine which octant a point falls into relative to the node centre. */
function octant(
  px: number,
  py: number,
  pz: number,
  node: OctreeNode,
): number {
  const cx = node.ox + node.size;
  const cy = node.oy + node.size;
  const cz = node.oz + node.size;
  let idx = 0;
  if (px >= cx) idx |= 1;
  if (py >= cy) idx |= 2;
  if (pz >= cz) idx |= 4;
  return idx;
}

/** Create a child node for the given octant index. */
function childNode(parent: OctreeNode, oct: number): OctreeNode {
  const hs = parent.size * 0.5; // child half-width
  const ox = parent.ox + (oct & 1 ? parent.size : 0);
  const oy = parent.oy + (oct & 2 ? parent.size : 0);
  const oz = parent.oz + (oct & 4 ? parent.size : 0);
  return createNode(ox, oy, oz, hs);
}

/** Insert a body into the tree. */
function insert(node: OctreeNode, bodies: Body[], idx: number): void {
  const pos = bodies[idx].position;
  const mass = bodies[idx].mass;

  if (node.totalMass === 0 && node.bodyIndex === -1) {
    // Empty leaf → just store the body
    node.bodyIndex = idx;
    node.totalMass = mass;
    node.cx = pos[0];
    node.cy = pos[1];
    node.cz = pos[2];
    return;
  }

  // If this node currently holds exactly one body (leaf), subdivide
  if (node.bodyIndex !== -1) {
    node.children = new Array<OctreeNode | null>(8).fill(null);
    const existIdx = node.bodyIndex;
    node.bodyIndex = -1;
    // Re-insert the existing body into the appropriate child
    reinsertIntoChild(node, bodies, existIdx);
  }

  // Insert the new body into the appropriate child
  reinsertIntoChild(node, bodies, idx);

  // Update centre-of-mass
  const newMass = node.totalMass + mass;
  node.cx = (node.cx * node.totalMass + pos[0] * mass) / newMass;
  node.cy = (node.cy * node.totalMass + pos[1] * mass) / newMass;
  node.cz = (node.cz * node.totalMass + pos[2] * mass) / newMass;
  node.totalMass = newMass;
}

function reinsertIntoChild(
  node: OctreeNode,
  bodies: Body[],
  idx: number,
): void {
  const pos = bodies[idx].position;
  const oct = octant(pos[0], pos[1], pos[2], node);
  if (!node.children![oct]) {
    node.children![oct] = childNode(node, oct);
  }
  insert(node.children![oct]!, bodies, idx);
}

// ─── Tree walk — compute acceleration on body i ────────────────

const thetaSq = BH_THETA * BH_THETA;

function computeAccel(
  node: OctreeNode,
  px: number,
  py: number,
  pz: number,
  bodyIdx: number,
  acc: Vec3,
): void {
  if (node.totalMass === 0) return;

  // If this is a leaf containing a single different body
  if (node.bodyIndex !== -1) {
    if (node.bodyIndex === bodyIdx) return; // skip self

    const dx = node.cx - px;
    const dy = node.cy - py;
    const dz = node.cz - pz;
    const distSq = dx * dx + dy * dy + dz * dz + SOFTENING_SQ;
    const invDist3 = G * node.totalMass / (distSq * Math.sqrt(distSq));
    acc[0] += invDist3 * dx;
    acc[1] += invDist3 * dy;
    acc[2] += invDist3 * dz;
    return;
  }

  // Internal node — check opening angle
  const dx = node.cx - px;
  const dy = node.cy - py;
  const dz = node.cz - pz;
  const distSq = dx * dx + dy * dy + dz * dz + SOFTENING_SQ;
  const sizeOverDist = (2 * node.size) * (2 * node.size) / distSq;

  if (sizeOverDist < thetaSq) {
    // Far enough — treat as single body
    const invDist3 = G * node.totalMass / (distSq * Math.sqrt(distSq));
    acc[0] += invDist3 * dx;
    acc[1] += invDist3 * dy;
    acc[2] += invDist3 * dz;
  } else {
    // Too close — recurse into children
    if (node.children) {
      for (let c = 0; c < 8; c++) {
        if (node.children[c]) {
          computeAccel(node.children[c]!, px, py, pz, bodyIdx, acc);
        }
      }
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * O(N log N) Barnes-Hut gravitational force solver.
 * Builds an octree and uses the opening-angle criterion (θ)
 * to approximate distant clusters as single masses.
 */
export const barnesHut: ForceSolver = (bodies: Body[]): Vec3[] => {
  const n = bodies.length;
  if (n === 0) return [];

  // 1. Determine bounding box
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  for (let i = 0; i < n; i++) {
    const p = bodies[i].position;
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[2] < minZ) minZ = p[2];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
    if (p[2] > maxZ) maxZ = p[2];
  }

  // Make the bounding box a cube with some padding
  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1e-6);
  const pad = span * 0.01;
  const halfSize = (span + 2 * pad) * 0.5;
  const root = createNode(
    minX - pad,
    minY - pad,
    minZ - pad,
    halfSize,
  );

  // 2. Insert all bodies
  for (let i = 0; i < n; i++) {
    insert(root, bodies, i);
  }

  // 3. Compute accelerations
  const acc: Vec3[] = Array.from({ length: n }, () => [0, 0, 0] as Vec3);

  for (let i = 0; i < n; i++) {
    const p = bodies[i].position;
    computeAccel(root, p[0], p[1], p[2], i, acc[i]);
  }

  return acc;
};
