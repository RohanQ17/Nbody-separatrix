/**
 * GPU device acquisition with graceful fallback.
 */

export interface GPUHandle {
  device: GPUDevice;
  adapter: GPUAdapter;
}

/**
 * Attempt to acquire a WebGPU device.
 * Returns null if WebGPU is not available.
 */
export async function initGPU(): Promise<GPUHandle | null> {
  // Check for WebGPU support
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    console.warn('[GPU] WebGPU not available in this browser');
    return null;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });

    if (!adapter) {
      console.warn('[GPU] No suitable GPU adapter found');
      return null;
    }

    const device = await adapter.requestDevice({
      requiredFeatures: [],
      requiredLimits: {},
    });

    device.lost.then((info) => {
      console.error('[GPU] Device lost:', info.message);
    });

    console.log('[GPU] WebGPU device acquired successfully');
    return { device, adapter };
  } catch (err) {
    console.warn('[GPU] Failed to initialize WebGPU:', err);
    return null;
  }
}
