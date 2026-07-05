import { Config } from '../core/config';
import { Constants } from '../core/constants';
import { app } from '../core/app';
import { camera } from './camera';
import { ownership } from '../network/ownership';
import { physics } from '../physics/physics';
import { particles } from './particles';
import { interpolator } from '../network/interpolation';
import { viewportTracker } from '../network/viewport';

/** Size in CSS pixels of the topology minimap's longer edge. */
const MINIMAP_MAX_DIMENSION = 180;
/** Padding from the bottom-right corner of the screen. */
const MINIMAP_MARGIN = 20;

class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor() {
        this.canvas = document.getElementById('worldCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();

        this.render = this.render.bind(this);
    }

    public init(): void {
        const originalLoop = app.loop;
        app.loop = (time: number) => {
            originalLoop.call(app, time);
            this.render();
        };
    }

    private resize(): void {
        const dpr = Config.render.pixelRatio;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;

        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;

        this.ctx.scale(dpr, dpr);
    }

    private render(): void {
        this.ctx.fillStyle = Config.render.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        camera.update();
        camera.applyTransform(this.ctx);

        this.drawGrid();

        let renderObjects: any[] = [];
        if (ownership.isOwner) {
            renderObjects = physics.objects;
        } else {
            // Use the interpolated estimate rather than the raw last-received
            // snapshot, so motion stays smooth between network updates.
            renderObjects = interpolator.getInterpolatedObjects();
        }

        for (const obj of renderObjects) {
            const radius = obj.radius || Math.max(obj.width || 0, obj.height || 0) / 2 || 20;

            if (camera.isVisible(obj.x || obj.pos.x, obj.y || obj.pos.y, radius)) {
                this.drawObject(obj);
            }
        }

        particles.updateAndDraw(this.ctx, app.deltaTime);

        if (physics.gameState === 'PLAYING') {
            const rects = viewportTracker.getAllRects();
            if (rects.length > 0) {
                let maxY = -Infinity;
                let minX = Infinity;
                let maxX = -Infinity;
                for (const r of rects) {
                    if (r.left < minX) minX = r.left;
                    if (r.left + r.width > maxX) maxX = r.left + r.width;
                    if (r.top + r.height > maxY) maxY = r.top + r.height;
                }
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                for (let x = minX - 100; x < maxX + 100; x += 40) {
                    this.ctx.moveTo(x, maxY);
                    this.ctx.lineTo(x + 20, maxY - 40);
                    this.ctx.lineTo(x + 40, maxY);
                }
                this.ctx.fill();
            }
        }

        camera.restoreTransform(this.ctx);

        // Minimap is drawn in screen space (after restoreTransform) since it's
        // a fixed HUD-style overlay, not part of the world.
        this.drawTopologyMinimap();
    }

    private drawGrid(): void {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 2;

        const gridSize = 200;
        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const startY = Math.floor(camera.y / gridSize) * gridSize;

        const endX = startX + window.innerWidth + gridSize;
        const endY = startY + window.innerHeight + gridSize;

        this.ctx.beginPath();
        for (let x = startX; x < endX; x += gridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }
        for (let y = startY; y < endY; y += gridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }
        this.ctx.stroke();
    }

    private drawObject(obj: any): void {
        const type = obj.type !== undefined ? obj.type : obj.t;
        const color = obj.color !== undefined ? obj.color : obj.c;
        const x = obj.pos ? obj.pos.x : obj.x;
        const y = obj.pos ? obj.pos.y : obj.y;
        const angle = obj.angle !== undefined ? obj.angle : obj.a;
        const radius = obj.radius !== undefined ? obj.radius : (obj.s || Math.max(obj.width || obj.w || 0, obj.height || obj.h || 0) / 2 || 20);

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle || 0);

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#ffffff33';
        this.ctx.lineWidth = 2;

        if (type === Constants.TYPES.BALL) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        } else if (type === Constants.TYPES.BOX || type === Constants.TYPES.ROPE_SEGMENT) {
            const w = obj.width !== undefined ? obj.width : (obj.w || radius * 2);
            const h = obj.height !== undefined ? obj.height : (obj.h || radius * 2);
            this.ctx.beginPath();
            this.ctx.rect(-w/2, -h/2, w, h);
            this.ctx.fill();
            this.ctx.stroke();
        } else if (type === Constants.TYPES.PADDLE) {
            const w = obj.width !== undefined ? obj.width : (obj.w || 300);
            const h = obj.height !== undefined ? obj.height : (obj.h || 20);
            
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = color;
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.roundRect(-w/2, -h/2, w, h, 10);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        } else if (type === Constants.TYPES.PORTAL) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = color;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 8;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            this.ctx.globalAlpha = 0.5;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }

        this.ctx.restore();
    }

    /**
     * Draws a small overlay in the bottom-right corner showing this tab's
     * window and every known peer's window as rectangles positioned relative
     * to one another in world space — a "you are here" map of the distributed
     * layout. Purely a HUD element; drawn in screen space, unaffected by camera pan.
     */
    private drawTopologyMinimap(): void {
        const rects = viewportTracker.getAllRects();
        if (rects.length === 0) return;

        // Compute bounding box of all known viewports so we can scale them
        // down to fit the fixed-size minimap area.
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const r of rects) {
            minX = Math.min(minX, r.left);
            minY = Math.min(minY, r.top);
            maxX = Math.max(maxX, r.left + r.width);
            maxY = Math.max(maxY, r.top + r.height);
        }

        const worldW = Math.max(maxX - minX, 1);
        const worldH = Math.max(maxY - minY, 1);
        const scale = Math.min(MINIMAP_MAX_DIMENSION / worldW, MINIMAP_MAX_DIMENSION / worldH);

        const mapW = worldW * scale;
        const mapH = worldH * scale;

        const originX = this.canvas.width / Config.render.pixelRatio - mapW - MINIMAP_MARGIN;
        const originY = this.canvas.height / Config.render.pixelRatio - mapH - MINIMAP_MARGIN;

        this.ctx.save();

        // Backing panel
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(originX - 8, originY - 8, mapW + 16, mapH + 16, 8);
        this.ctx.fill();
        this.ctx.stroke();

        // Own rect drawn distinctly (accent color, filled) vs peers (outline only).
        for (const rect of rects) {
            const isSelf = rect === viewportTracker.selfRect;
            const x = originX + (rect.left - minX) * scale;
            const y = originY + (rect.top - minY) * scale;
            const w = Math.max(rect.width * scale, 3);
            const h = Math.max(rect.height * scale, 3);

            this.ctx.beginPath();
            this.ctx.rect(x, y, w, h);
            if (isSelf) {
                this.ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
                this.ctx.fill();
                this.ctx.strokeStyle = '#3b82f6';
            } else {
                this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
            }
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }
}

export const renderer = new Renderer();