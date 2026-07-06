import { EngineSnapshot } from '@tabverse/engine';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.scale(dpr, dpr);
  }

  public render(snapshot: EngineSnapshot) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render entities
    for (const entity of snapshot.entities) {
      const transform = entity.components.find(c => c.type === 'Transform');
      const collider = entity.components.find(c => c.type === 'Collider');
      
      if (transform && collider) {
        if (collider.shape === 'circle') {
          this.ctx.beginPath();
          this.ctx.arc(transform.x, transform.y, collider.radius, 0, Math.PI * 2);
          this.ctx.fillStyle = '#ff0055';
          this.ctx.fill();
        }
      }
    }
  }
}
