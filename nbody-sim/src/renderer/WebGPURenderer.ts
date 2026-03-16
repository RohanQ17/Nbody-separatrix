/**
 * WebGPU Renderer — scaffolding for future GPU-accelerated rendering.
 *
 * For the base version, this module exports a class that mirrors the
 * Canvas2DRenderer API but uses WebGPU for rendering particles.
 * If WebGPU is not available, this class will not be instantiated
 * (the app falls back to Canvas2DRenderer).
 */

import type { Body } from '../core/types';

export class WebGPURenderer {
  private device: GPUDevice;
  private canvas: HTMLCanvasElement;
  private context: GPUCanvasContext;
  private format: GPUTextureFormat;

  constructor(canvas: HTMLCanvasElement, device: GPUDevice) {
    this.device = device;
    this.canvas = canvas;

    const context = canvas.getContext('webgpu');
    if (!context) throw new Error('Cannot get WebGPU canvas context');
    this.context = context;

    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });
  }

  /**
   * Render bodies. Currently a minimal pass that clears to dark and
   * draws a simple particle representation.
   * Full GPU rendering pipeline will be implemented in a later extension.
   */
  render(_bodies: Body[]): void {
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.04, g: 0.04, b: 0.06, a: 1.0 },
          loadOp: 'clear' as GPULoadOp,
          storeOp: 'store' as GPUStoreOp,
        },
      ],
    });

    // TODO: Bind render pipeline and draw particles via render.wgsl
    // For now, just clear the screen to show WebGPU is working.

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
  }

  dispose(): void {
    this.context.unconfigure();
  }
}
