import { Config } from '../core/config';
import { Constants } from '../core/constants';
import { events } from '../core/events';
import { ownership } from '../network/ownership';
import { sync } from '../network/sync';
import { app } from '../core/app';
import { Collision } from './collision';
import { Resolver } from './resolver';
import { Ball } from '../objects/Ball';
import { Box } from '../objects/Box';
import { Portal } from '../objects/Portal';
import { PhysicsBody } from './body';
import { SpawnReqPayload, Vector2 } from '../types/index';
import { MathUtils } from '../utilities/math';

interface MouseConstraint {
    bodyId: string;
    localAnchor: Vector2;
    target: Vector2;
}

class PhysicsEngine {
    public objects: PhysicsBody[];
    private accumulator: number;
    public bounds: { width: number; height: number };
    public mouseConstraints: Map<string, MouseConstraint>;

    constructor() {
        this.objects = [];
        this.accumulator = 0;
        this.mouseConstraints = new Map();
        
        // Massive bounds to allow multiple monitors to act as one virtual world
        this.bounds = { 
            width: 50000, 
            height: 50000 
        };
    }

    public init(): void {
        const originalLoop = app.loop;
        app.loop = (time: number) => {
            originalLoop.call(app, time);
            this.update(app.deltaTime);
        };

        events.on(Constants.EVENTS.NET_SPAWN_REQ, (payload: SpawnReqPayload) => {
            if (ownership.isOwner) {
                this.spawnObject(payload);
            }
        });

        events.on(Constants.EVENTS.NET_GRAB_REQ, (data: any) => {
            if (!ownership.isOwner) return;
            const p = { x: data.x, y: data.y };
            
            for (const obj of this.objects) {
                const localX = (p.x - obj.pos.x) * Math.cos(-obj.angle) - (p.y - obj.pos.y) * Math.sin(-obj.angle);
                const localY = (p.x - obj.pos.x) * Math.sin(-obj.angle) + (p.y - obj.pos.y) * Math.cos(-obj.angle);
                
                const radius = obj.radius || (obj.size! / 2);
                if (Math.abs(localX) < radius && Math.abs(localY) < radius) {
                    this.mouseConstraints.set(data.sender, {
                        bodyId: obj.id,
                        localAnchor: { x: localX, y: localY },
                        target: { x: p.x, y: p.y }
                    });
                    break;
                }
            }
        });

        events.on(Constants.EVENTS.NET_GRAB_MOVE, (data: any) => {
            if (!ownership.isOwner) return;
            const constraint = this.mouseConstraints.get(data.sender);
            if (constraint) {
                constraint.target = { x: data.x, y: data.y };
            }
        });

        events.on(Constants.EVENTS.NET_GRAB_END, (data: any) => {
            if (!ownership.isOwner) return;
            this.mouseConstraints.delete(data.sender);
        });
    }

    private spawnObject(data: SpawnReqPayload): void {
        if (data.type === 'CLEAR') {
            this.objects = [];
            return;
        }

        let obj: PhysicsBody | null = null;
        if (data.type === Constants.TYPES.BALL) {
            obj = new Ball(data.x, data.y, data.extra || 20);
        } else if (data.type === Constants.TYPES.BOX) {
            obj = new Box(data.x, data.y, data.extra || 40, data.extra || 40);
        } else if (data.type === Constants.TYPES.PORTAL) {
            const p1 = new Portal(data.x, data.y, '#00aaff');
            const p2 = new Portal(data.x + 400, data.y, '#ffaa00');
            p1.targetPortalId = p2.id;
            p2.targetPortalId = p1.id;
            this.objects.push(p1, p2);
            return;
        }
        
        if (obj) {
            obj.vel.x = (Math.random() - 0.5) * 100;
            obj.vel.y = (Math.random() - 0.5) * 100;
            this.objects.push(obj);
        }
    }

    private update(dt: number): void {
        if (!ownership.isOwner) return;

        const timeStep = 1 / Config.physics.fps;
        this.accumulator += dt;

        while (this.accumulator >= timeStep) {
            this.step(timeStep);
            this.accumulator -= timeStep;
        }

        sync.broadcastState(this.objects);
    }

    private step(dt: number): void {
        const substep = dt / Config.physics.substeps;
        
        for (let i = 0; i < Config.physics.substeps; i++) {
            this.integrate(substep);
            this.solveCollisions();
            this.constrainBounds();
        }
    }

    private integrate(dt: number): void {
        const gravity = Config.physics.gravity;
        
        for (const obj of this.objects) {
            if (obj.teleportCooldown > 0) obj.teleportCooldown -= dt;
            if (obj.isStatic) continue;

            obj.applyForce(gravity.x * obj.mass, gravity.y * obj.mass);

            obj.vel.x += obj.acc.x * dt;
            obj.vel.y += obj.acc.y * dt;
            
            obj.vel.x *= (1 - Config.physics.friction * dt);
            obj.vel.y *= (1 - Config.physics.friction * dt);

            obj.pos.x += obj.vel.x * dt;
            obj.pos.y += obj.vel.y * dt;
            
            obj.angle += obj.angularVel * dt;

            obj.acc.x = 0;
            obj.acc.y = 0;
        }
        
        const stiffness = 10000;
        const damping = 500;
        for (const [sender, constraint] of this.mouseConstraints.entries()) {
            const obj = this.objects.find(o => o.id === constraint.bodyId);
            if (!obj) {
                this.mouseConstraints.delete(sender);
                continue;
            }
            
            const cos = Math.cos(obj.angle);
            const sin = Math.sin(obj.angle);
            const worldAnchorX = obj.pos.x + (constraint.localAnchor.x * cos - constraint.localAnchor.y * sin);
            const worldAnchorY = obj.pos.y + (constraint.localAnchor.x * sin + constraint.localAnchor.y * cos);
            
            const dx = constraint.target.x - worldAnchorX;
            const dy = constraint.target.y - worldAnchorY;
            
            const rx = worldAnchorX - obj.pos.x;
            const ry = worldAnchorY - obj.pos.y;
            
            const pointVelX = obj.vel.x - obj.angularVel * ry;
            const pointVelY = obj.vel.y + obj.angularVel * rx;
            
            const fx = dx * stiffness - pointVelX * damping;
            const fy = dy * stiffness - pointVelY * damping;
            
            obj.applyForce(fx, fy);
            
            const torque = MathUtils.cross(rx, ry, fx, fy);
            obj.angularVel += torque * obj.invInertia * dt;
        }
    }

    private solveCollisions(): void {
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const b1 = this.objects[i]!;
                const b2 = this.objects[j]!;
                
                if (b1.isSensor || b2.isSensor) continue;
                
                const manifold = Collision.check(b1, b2);
                if (manifold) {
                    Resolver.resolve(b1, b2, manifold);
                }
            }
        }
    }

    private constrainBounds(): void {
        for (const obj of this.objects) {
            const radius = obj.radius || Math.max(obj.width || 0, obj.height || 0) / 2 || 20;
            
            // Floor bounce (bottom of the logical screen)
            if (obj.pos.y + radius > window.screen.height) {
                obj.pos.y = window.screen.height - radius;
                obj.vel.y *= -obj.restitution;
            }
            // Ceiling bounce (optional, but good to keep them from getting lost forever)
            else if (obj.pos.y - radius < -10000) {
                obj.pos.y = -10000 + radius;
                obj.vel.y *= -obj.restitution;
            }

            // Massive X bounds to allow traveling to left/right monitors seamlessly
            if (obj.pos.x + radius > 50000) {
                obj.pos.x = 50000 - radius;
                obj.vel.x *= -obj.restitution;
            } else if (obj.pos.x - radius < -50000) {
                obj.pos.x = -50000 + radius;
                obj.vel.x *= -obj.restitution;
            }
        }

        const portals = this.objects.filter(o => o.type === Constants.TYPES.PORTAL) as Portal[];
        const dynamics = this.objects.filter(o => !o.isStatic && o.teleportCooldown <= 0);

        for (const obj of dynamics) {
            for (const portal of portals) {
                if (!portal.targetPortalId) continue;
                
                const distSq = MathUtils.distanceSq(obj.pos.x, obj.pos.y, portal.pos.x, portal.pos.y);
                if (distSq < portal.radius! * portal.radius!) {
                    const target = portals.find(p => p.id === portal.targetPortalId);
                    if (target) {
                        obj.pos.x = target.pos.x;
                        obj.pos.y = target.pos.y;
                        
                        const speed = Math.sqrt(obj.vel.x * obj.vel.x + obj.vel.y * obj.vel.y);
                        obj.vel.y = -Math.max(speed, 500); 
                        obj.vel.x = (Math.random() - 0.5) * 200;
                        
                        obj.teleportCooldown = 0.5;
                    }
                }
            }
        }
    }
}

export const physics = new PhysicsEngine();
