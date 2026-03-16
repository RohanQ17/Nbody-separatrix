/**
 * GPU buffer management for N-body simulation.
 *
 * Bodies are stored in Structure-of-Arrays layout:
 *   - positions:  Float32Array [x0,y0,z0, x1,y1,z1, ...]  (3 floats per body, padded to vec4)
 *   - velocities: same layout
 *   - masses:     Float32Array [m0, m1, ...]
 *   - accelerations: same layout as positions (output of gravity kernel)
 *
 * All position/velocity buffers use vec4 alignment (16 bytes) for GPU compatibility.
 */

export interface SimBuffers {
  position: GPUBuffer;
  velocity: GPUBuffer;
  mass: GPUBuffer;
  acceleration: GPUBuffer;
  uniform: GPUBuffer;
  n: number;
}

/** Uniform buffer layout: { n: u32, dt: f32, softening: f32, _pad: u32 } = 16 bytes */
const UNIFORM_SIZE = 16;

/**
 * Create GPU buffers for `n` bodies.
 */
export function createSimBuffers(device: GPUDevice, n: number): SimBuffers {
  const vec4Bytes = n * 4 * 4; // n * 4 floats * 4 bytes

  const position = device.createBuffer({
    size: vec4Bytes,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });

  const velocity = device.createBuffer({
    size: vec4Bytes,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });

  const mass = device.createBuffer({
    size: n * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const acceleration = device.createBuffer({
    size: vec4Bytes,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  const uniform = device.createBuffer({
    size: UNIFORM_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  return { position, velocity, mass, acceleration, uniform, n };
}

/**
 * Upload body data from CPU arrays to GPU buffers.
 */
export function uploadBodies(
  device: GPUDevice,
  buffers: SimBuffers,
  positions: Float32Array,  // vec4-padded: length = n * 4
  velocities: Float32Array, // vec4-padded: length = n * 4
  masses: Float32Array,     // length = n
): void {
  device.queue.writeBuffer(buffers.position, 0, positions);
  device.queue.writeBuffer(buffers.velocity, 0, velocities);
  device.queue.writeBuffer(buffers.mass, 0, masses);
}

/**
 * Upload uniform data (N, dt, softening).
 */
export function uploadUniforms(
  device: GPUDevice,
  buffers: SimBuffers,
  dt: number,
  softening: number,
): void {
  const data = new ArrayBuffer(UNIFORM_SIZE);
  const view = new DataView(data);
  view.setUint32(0, buffers.n, true);   // n
  view.setFloat32(4, dt, true);          // dt
  view.setFloat32(8, softening, true);   // softening
  view.setUint32(12, 0, true);           // padding
  device.queue.writeBuffer(buffers.uniform, 0, data);
}

/**
 * Destroy all buffers.
 */
export function destroySimBuffers(buffers: SimBuffers): void {
  buffers.position.destroy();
  buffers.velocity.destroy();
  buffers.mass.destroy();
  buffers.acceleration.destroy();
  buffers.uniform.destroy();
}
