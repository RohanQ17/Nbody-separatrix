import { useState, useEffect } from 'react';
import { initGPU, type GPUHandle } from '../../gpu/device';

/**
 * React hook to acquire a WebGPU device.
 * Returns { device, isWebGPUAvailable, loading }.
 * Falls back gracefully if WebGPU is not supported.
 */
export function useGPUDevice() {
  const [handle, setHandle] = useState<GPUHandle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    initGPU().then((result) => {
      if (!cancelled) {
        setHandle(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    device: handle?.device ?? null,
    adapter: handle?.adapter ?? null,
    isWebGPUAvailable: handle !== null,
    loading,
  };
}
