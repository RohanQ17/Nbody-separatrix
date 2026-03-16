import type { Body, Vec3 } from '../core/types';
import { TrailBuffer } from './trailBuffer';

/**
 * Canvas2D fallback renderer for the N-body simulation.
 *
 * Features:
 *   - Pan and zoom (mouse wheel + drag)
 *   - Body rendering as filled circles scaled by mass
 *   - Orbit trails with fading
 *   - Colour coding by mass
 */
export class Canvas2DRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Camera
  private offsetX = 0;
  private offsetY = 0;
  private zoom = 40; // pixels per simulation unit

  // Interaction state
  private dragging = false;
  private lastMouse: [number, number] = [0, 0];

  // Trails
  private trailBuffer: TrailBuffer | null = null;
  private trailFrame = 0;

  // ─── Colour palette ───────────────────────────────────────────
  private static bodyColors = [
    '#60a5fa', // blue
    '#f472b6', // pink
    '#34d399', // green
    '#fbbf24', // amber
    '#a78bfa', // violet
    '#fb923c', // orange
    '#2dd4bf', // teal
    '#f87171', // red
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;

    // Event listeners
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mouseleave', this.onMouseUp);
  }

  // ─── Camera controls ─────────────────────────────────────────

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    this.zoom *= factor;
    this.zoom = Math.max(1, Math.min(this.zoom, 2000));
  };

  private onMouseDown = (e: MouseEvent) => {
    this.dragging = true;
    this.lastMouse = [e.clientX, e.clientY];
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.dragging) return;
    this.offsetX += e.clientX - this.lastMouse[0];
    this.offsetY += e.clientY - this.lastMouse[1];
    this.lastMouse = [e.clientX, e.clientY];
  };

  private onMouseUp = () => {
    this.dragging = false;
  };

  // ─── Coordinate transform ────────────────────────────────────

  private simToScreen(pos: Vec3): [number, number] {
    const cx = this.canvas.width / 2 + this.offsetX;
    const cy = this.canvas.height / 2 + this.offsetY;
    return [cx + pos[0] * this.zoom, cy - pos[1] * this.zoom];
  }

  // ─── Rendering ────────────────────────────────────────────────

  render(bodies: Body[]): void {
    const { canvas, ctx } = this;
    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    this.drawGrid();

    // Initialize trail buffer if needed
    if (!this.trailBuffer || this.trailBuffer.bodyCount !== bodies.length) {
      this.trailBuffer = new TrailBuffer(bodies.length, 512);
      this.trailFrame = 0;
    }

    // Push trail every 2nd frame
    if (this.trailFrame % 2 === 0) {
      this.trailBuffer.push(bodies.map((b) => b.position));
    }
    this.trailFrame++;

    // Draw trails
    this.drawTrails(bodies);

    // Draw bodies
    for (let i = 0; i < bodies.length; i++) {
      this.drawBody(bodies[i], i);
    }
  }

  private drawGrid(): void {
    const { ctx, canvas, zoom } = this;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;

    // Determine grid spacing that looks reasonable at current zoom
    let spacing = 1;
    while (spacing * zoom < 40) spacing *= 2;
    while (spacing * zoom > 160) spacing /= 2;

    const cx = canvas.width / 2 + this.offsetX;
    const cy = canvas.height / 2 + this.offsetY;

    // Vertical lines
    const startX = Math.floor(-cx / (spacing * zoom)) * spacing;
    const endX = Math.ceil((canvas.width - cx) / (spacing * zoom)) * spacing;
    for (let x = startX; x <= endX; x += spacing) {
      const sx = cx + x * zoom;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    const startY = Math.floor(-cy / (spacing * zoom)) * spacing;
    const endY = Math.ceil((canvas.height - cy) / (spacing * zoom)) * spacing;
    for (let y = startY; y <= endY; y += spacing) {
      const sy = cy + y * zoom;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(canvas.width, sy);
      ctx.stroke();
    }
  }

  private drawTrails(bodies: Body[]): void {
    const { ctx } = this;
    if (!this.trailBuffer) return;

    for (let i = 0; i < bodies.length; i++) {
      const trail = this.trailBuffer.getTrail(i);
      if (trail.length < 2) continue;

      const color = Canvas2DRenderer.bodyColors[i % Canvas2DRenderer.bodyColors.length];

      ctx.beginPath();
      const [sx, sy] = this.simToScreen(trail[0]);
      ctx.moveTo(sx, sy);

      for (let j = 1; j < trail.length; j++) {
        const [tx, ty] = this.simToScreen(trail[j]);
        ctx.lineTo(tx, ty);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  private drawBody(body: Body, index: number): void {
    const { ctx } = this;
    const [sx, sy] = this.simToScreen(body.position);
    const color = Canvas2DRenderer.bodyColors[index % Canvas2DRenderer.bodyColors.length];

    // Radius proportional to log(mass+1), minimum 3px
    const radius = Math.max(3, Math.log(body.mass + 1) * 4 + 2);

    // Glow effect
    const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 3);
    gradient.addColorStop(0, color + 'aa');
    gradient.addColorStop(0.4, color + '33');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    ctx.arc(sx, sy, radius * 3, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Solid core
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Bright centre
    ctx.beginPath();
    ctx.arc(sx, sy, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /** Resize the canvas to match its display size. */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
  }

  /** Clean up event listeners. */
  dispose(): void {
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseUp);
  }
}
