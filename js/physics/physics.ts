import { Config } from '../core/config';
import { Constants } from '../core/constants';
import { events } from '../core/events';
import { ownership } from '../network/ownership';
import { sync } from '../network/sync';
import { app } from '../core/app';
import { viewportTracker } from '../network/viewport';
import { Collision } from './collision';
import { Resolver } from './resolver';
import { Ball } from '../objects/Ball';
import { Box } from '../objects/Box';
import { Portal } from '../objects/Portal';
import { buildRope } from '../objects/Rope';
import { DistanceConstraint } from './constraints';
import { Paddle } from '../objects/Paddle';
import { PhysicsBody } from './body';
import { SpawnReqPayload, ViewportRect, Vector2 } from '../types/index';
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
    public distanceConstraints: DistanceConstraint[];

    public gameState: 'MENU' | 'PLAYING' | 'GAMEOVER';
    public score: number;
    public paddleX: number;
    public paddleDir: number;

    constructor() {
        this.objects = [];
        this.accumulator = 0;
        this.mouseConstraints = new Map();
        this.distanceConstraints = [];

        this.gameState = 'MENU';
        this.score = 0;
        this.paddleX = 0;
        this.paddleDir = 0;

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

        events.on(Constants.EVENTS.NET_GAME_STATE, (data: any) => {
            this.gameState = data.status;
            this.score = data.score;
            this.paddleX = data.paddleX;
        });

        events.on(Constants.EVENTS.NET_PADDLE_UPDATE, (data: any) => {
            if (ownership.isOwner) {
                this.paddleDir = data.dir;
            }
        });

        events.on(Constants.EVENTS.NET_GRAB_REQ, (data: any) => {
            if (!ownership.isOwner) return;
            const p = { x: data.x, y: data.y };

            for (const obj of this.objects) {
                if (obj.isStatic) continue; // Can't grab anchored rope points / portals
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

    /**
     * Replaces the entire simulation state, e.g. when restoring a persisted
     * snapshot on boot. Existing constraints/mouse-grabs are cleared since
     * they reference specific object instances that no longer exist.
     */
    public loadState(objects: PhysicsBody[]): void {
        this.objects = objects;
        this.distanceConstraints = [];
        this.mouseConstraints.clear();
    }

    private spawnObject(data: SpawnReqPayload): void {
        if (data.type === 'CLEAR') {
            this.objects = [];
            this.distanceConstraints = [];
            this.mouseConstraints.clear();
            return;
        }

        if (data.type === 'START_GAME') {
            this.objects = [];
            this.distanceConstraints = [];
            this.mouseConstraints.clear();
            this.gameState = 'PLAYING';
            this.score = 0;
            this.paddleDir = 0;

            const rects = viewportTracker.getAllRects();
            if (rects.length === 0) return;
            
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (const r of rects) {
                if (r.left < minX) minX = r.left;
                if (r.left + r.width > maxX) maxX = r.left + r.width;
                if (r.top < minY) minY = r.top;
                if (r.top + r.height > maxY) maxY = r.top + r.height;
            }
            
            this.paddleX = (minX + maxX) / 2;

            const topPaddle = new Paddle(this.paddleX, minY + 20, true);
            const bottomPaddle = new Paddle(this.paddleX, maxY - 20, false);
            this.objects.push(topPaddle, bottomPaddle);

            const ball = new Ball(this.paddleX, (minY + maxY) / 2, 30);
            ball.vel.x = (Math.random() - 0.5) * 800;
            ball.vel.y = (Math.random() > 0.5 ? 800 : -800);
            this.objects.push(ball);
            return;
        }

        if (data.type === 'ROPE') {
            if (this.objects.length >= Config.limits.maxObjects) return;
            const count = Math.min(data.extra || 10, Config.limits.maxRopeSegments);
            const { segments, constraints } = buildRope(data.x, data.y, count);
            this.objects.push(...segments);
            this.distanceConstraints.push(...constraints);
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
            obj.vel.x = (Math.random() - 0.5) * 1200;
            obj.vel.y = (Math.random() - 0.5) * 1200;
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
        sync.broadcastGameState(this.gameState, this.score, this.paddleX);
    }

    private step(dt: number): void {
        const substep = dt / Config.physics.substeps;

        for (let i = 0; i < Config.physics.substeps; i++) {
            this.integrate(substep);
            this.solveCollisions();
            this.solveDistanceConstraints();
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

            if (this.gameState === 'PLAYING' && obj.type === Constants.TYPES.BALL) {
                const targetSpeed = 1000 + (this.score / 10) * 50;
                const currentSpeed = Math.sqrt(obj.vel.x * obj.vel.x + obj.vel.y * obj.vel.y);
                if (currentSpeed > 0.1 && currentSpeed < targetSpeed) {
                    const ratio = targetSpeed / currentSpeed;
                    obj.vel.x *= ratio;
                    obj.vel.y *= ratio;
                }
            } else {
                obj.vel.x *= (1 - Config.physics.friction * dt);
                obj.vel.y *= (1 - Config.physics.friction * dt);
            }

            obj.pos.x += obj.vel.x * dt;
            obj.pos.y += obj.vel.y * dt;

            obj.angle += obj.angularVel * dt;

            obj.acc.x = 0;
            obj.acc.y = 0;
        }

        if (this.gameState === 'PLAYING') {
            const speed = 1500;
            this.paddleX += this.paddleDir * speed * dt;
            const paddles = this.objects.filter(o => o.type === Constants.TYPES.PADDLE);
            for (const p of paddles) {
                p.pos.x = this.paddleX;
            }
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
                    
                    if (this.gameState === 'PLAYING') {
                        const isBall = b1.type === Constants.TYPES.BALL || b2.type === Constants.TYPES.BALL;
                        const isPaddle = b1.type === Constants.TYPES.PADDLE || b2.type === Constants.TYPES.PADDLE;
                        if (isBall && isPaddle) {
                            const ball = b1.type === Constants.TYPES.BALL ? b1 : b2;
                            if (ball.teleportCooldown <= 0) { 
                                this.score += 10;
                                ball.teleportCooldown = 0.5; // Cooldown for score hit
                                ball.vel.x *= 1.05; // Slightly speed up
                                ball.vel.y *= 1.05;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Solves all active DistanceConstraints (rope links / joints). Run once per
     * substep, after collision resolution, so ropes settle into a stable shape
     * alongside regular rigid-body contacts rather than fighting them.
     */
    private solveDistanceConstraints(): void {
        for (const constraint of this.distanceConstraints) {
            constraint.solve();
        }
    }

    /**
     * Determines whether the given point is inside ANY known viewport,
     * including a small epsilon tolerance for edge-to-edge snapped windows.
     */
    private isPointInAnyRect(x: number, y: number, rects: ViewportRect[], excludeRect?: ViewportRect): boolean {
        const eps = 2; // Tolerance for snapped windows
        for (const r of rects) {
            if (r === excludeRect) continue;
            if (x >= r.left - eps && x <= r.left + r.width + eps &&
                y >= r.top - eps && y <= r.top + r.height + eps) {
                return true;
            }
        }
        return false;
    }

    private constrainBounds(): void {
        const rects = viewportTracker.getAllRects();
        if (rects.length === 0) return;

        for (const obj of this.objects) {
            if (obj.isStatic) continue;

            const radius = obj.radius || Math.max(obj.width || 0, obj.height || 0) / 2 || 20;

            // Find the rect that contains the object's center.
            let ownerRect = rects.find(r => 
                obj.pos.x >= r.left && obj.pos.x <= r.left + r.width &&
                obj.pos.y >= r.top && obj.pos.y <= r.top + r.height
            );

            if (!ownerRect) {
                // If completely outside all rects (e.g. spawned outside, or a tab was closed),
                // pull it towards the closest rect so it "flies" back into a visible window.
                let minDist = Infinity;
                for (const r of rects) {
                    const cx = r.left + r.width / 2;
                    const cy = r.top + r.height / 2;
                    const dist = MathUtils.distanceSq(obj.pos.x, obj.pos.y, cx, cy);
                    if (dist < minDist) {
                        minDist = dist;
                        ownerRect = r;
                    }
                }
            }

            if (ownerRect) {
                // Check Left Wall
                if (obj.pos.x - radius < ownerRect.left) {
                    if (!this.isPointInAnyRect(obj.pos.x - radius, obj.pos.y, rects, ownerRect)) {
                        obj.pos.x = ownerRect.left + radius;
                        obj.vel.x *= -obj.restitution;
                    }
                }
                // Check Right Wall
                else if (obj.pos.x + radius > ownerRect.left + ownerRect.width) {
                    if (!this.isPointInAnyRect(obj.pos.x + radius, obj.pos.y, rects, ownerRect)) {
                        obj.pos.x = ownerRect.left + ownerRect.width - radius;
                        obj.vel.x *= -obj.restitution;
                    }
                }

                // Check Top Wall
                if (obj.pos.y - radius < ownerRect.top) {
                    if (!this.isPointInAnyRect(obj.pos.x, obj.pos.y - radius, rects, ownerRect)) {
                        if (this.gameState === 'PLAYING' && obj.type === Constants.TYPES.BALL) {
                            this.gameState = 'GAMEOVER';
                        } else {
                            obj.pos.y = ownerRect.top + radius;
                            obj.vel.y *= -obj.restitution;
                        }
                    }
                }
                // Check Bottom Wall
                else if (obj.pos.y + radius > ownerRect.top + ownerRect.height) {
                    if (!this.isPointInAnyRect(obj.pos.x, obj.pos.y + radius, rects, ownerRect)) {
                        if (this.gameState === 'PLAYING' && obj.type === Constants.TYPES.BALL) {
                            this.gameState = 'GAMEOVER';
                        } else {
                            obj.pos.y = ownerRect.top + ownerRect.height - radius;
                            obj.vel.y *= -obj.restitution;
                        }
                    }
                }
            }
        }

        const portals = this.objects.filter(o => o.type === Constants.TYPES.PORTAL) as Portal[];
        const dynamics = this.objects.filter(o => !o.isStatic && o.teleportCooldown <= 0);

        for (const portal of portals) {
            if (!portal.targetPortalId) continue;
            for (const obj of dynamics) {
                const dx = portal.pos.x - obj.pos.x;
                const dy = portal.pos.y - obj.pos.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < 800 * 800 && distSq > 10) {
                    const dist = Math.sqrt(distSq);
                    // Gravitational pull towards the portal
                    const force = (200000 * obj.mass) / dist; 
                    obj.applyForce((dx / dist) * force, (dy / dist) * force);
                }

                if (distSq < portal.radius! * portal.radius!) {
                    const target = portals.find(p => p.id === portal.targetPortalId);
                    if (target) {
                        obj.pos.x = target.pos.x;
                        obj.pos.y = target.pos.y;

                        const speed = Math.sqrt(obj.vel.x * obj.vel.x + obj.vel.y * obj.vel.y);
                        // Shoot out extremely fast
                        obj.vel.y = -Math.max(speed * 1.5, 1200);
                        obj.vel.x = (Math.random() - 0.5) * 800;

                        obj.teleportCooldown = 0.5;
                    }
                }
            }
        }
    }
}

export const physics = new PhysicsEngine();