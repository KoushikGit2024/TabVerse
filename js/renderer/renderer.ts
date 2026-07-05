import { Config } from '../core/config';
import { Constants } from '../core/constants';
import { app } from '../core/app';
import { camera } from './camera';
import { ownership } from '../network/ownership';
import { sync } from '../network/sync';
import { physics } from '../physics/physics';
import { particles } from './particles';

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
            if (sync.stateBuffer.length > 0) {
                renderObjects = sync.stateBuffer[sync.stateBuffer.length - 1]!.objects;
            }
        }

        for (const obj of renderObjects) {
            const radius = obj.radius || Math.max(obj.width || 0, obj.height || 0) / 2 || 20;
            
            if (camera.isVisible(obj.x || obj.pos.x, obj.y || obj.pos.y, radius)) {
                this.drawObject(obj);
            }
        }

        particles.updateAndDraw(this.ctx, app.deltaTime);

        camera.restoreTransform(this.ctx);
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
        } else if (type === Constants.TYPES.BOX) {
            const w = obj.width !== undefined ? obj.width : (obj.w || radius * 2);
            const h = obj.height !== undefined ? obj.height : (obj.h || radius * 2);
            this.ctx.beginPath();
            this.ctx.rect(-w/2, -h/2, w, h);
            this.ctx.fill();
            this.ctx.stroke();
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
}

export const renderer = new Renderer();
