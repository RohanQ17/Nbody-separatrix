/**
 * Compute pipeline setup for GPU-based N-body simulation.
 */

export interface GravityPipeline {
  pipeline: GPUComputePipeline;
  bindGroupLayout: GPUBindGroupLayout;
}

/**
 * Create the gravity compute pipeline.
 *
 * The pipeline expects the following bind group layout:
 *   @group(0) @binding(0) positions  (storage, read)
 *   @group(0) @binding(1) velocities (storage, read_write)
 *   @group(0) @binding(2) masses     (storage, read)
 *   @group(0) @binding(3) accelerations (storage, read_write)
 *   @group(0) @binding(4) uniforms   (uniform)
 */
export function createGravityPipeline(
  device: GPUDevice,
  shaderCode: string,
): GravityPipeline {
  const shaderModule = device.createShaderModule({ code: shaderCode });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  const pipeline = device.createComputePipeline({
    layout: pipelineLayout,
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });

  return { pipeline, bindGroupLayout };
}

/**
 * Create a bind group for the gravity pipeline from existing buffers.
 */
export function createGravityBindGroup(
  device: GPUDevice,
  layout: GPUBindGroupLayout,
  posBuffer: GPUBuffer,
  velBuffer: GPUBuffer,
  massBuffer: GPUBuffer,
  accelBuffer: GPUBuffer,
  uniformBuffer: GPUBuffer,
): GPUBindGroup {
  return device.createBindGroup({
    layout,
    entries: [
      { binding: 0, resource: { buffer: posBuffer } },
      { binding: 1, resource: { buffer: velBuffer } },
      { binding: 2, resource: { buffer: massBuffer } },
      { binding: 3, resource: { buffer: accelBuffer } },
      { binding: 4, resource: { buffer: uniformBuffer } },
    ],
  });
}
