import { app } from '../core/app';

class Camera {
    public x: number;
    public y: number;
    public zoom: number;

    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
    }

    public update(): void {
        this.x = app.windowOffset.x;
        this.y = app.windowOffset.y;
    }

    public applyTransform(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    public restoreTransform(ctx: CanvasRenderingContext2D): void {
        ctx.restore();
    }

    public isVisible(worldX: number, worldY: number, radius: number): boolean {
        const screenX = worldX - this.x;
        const screenY = worldY - this.y;
        
        return (
            screenX + radius > 0 &&
            screenX - radius < window.innerWidth &&
            screenY + radius > 0 &&
            screenY - radius < window.innerHeight
        );
    }
}

export const camera = new Camera();
