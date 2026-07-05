import { Constants } from '../core/constants';
import { events } from '../core/events';
import { camera } from './camera';
import { Colors } from '../utilities/colors';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

class ParticleSystem {
    private particles: Particle[];

    constructor() {
        this.particles = [];
    }

    public init(): void {
        events.on(Constants.EVENTS.NET_PARTICLE_BURST, (data: any) => {
            this.spawnBurst(data.x, data.y, data.force, data.color);
        });
    }

    private spawnBurst(x: number, y: number, force: number, color?: string): void {
        const count = Math.min(Math.floor(force / 10), 30); // Max 30 particles per burst
        const baseColor = color || Colors.random();
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (force / 5) + 50;
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0 + Math.random() * 0.5, // 1 to 1.5 seconds
                color: baseColor,
                size: Math.random() * 4 + 2
            });
        }
    }

    public updateAndDraw(ctx: CanvasRenderingContext2D, dt: number): void {
        const gravity = 980; // Match Config.physics.gravity
        const boundsY = window.screen.height;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]!;
            
            p.vy += gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // Floor bounce
            if (p.y > boundsY) {
                p.y = boundsY;
                p.vy *= -0.5;
                p.vx *= 0.8;
            }

            p.life -= dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            if (camera.isVisible(p.x, p.y, p.size)) {
                ctx.save();
                ctx.globalAlpha = p.life / p.maxLife;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }
}

export const particles = new ParticleSystem();
