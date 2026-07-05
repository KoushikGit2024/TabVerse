import { Random } from '../utilities/random';
import { Colors } from '../utilities/colors';
import { Vector2 } from '../types/index';

export abstract class PhysicsBody {
    public readonly id: string;
    public readonly type: number;
    
    public pos: Vector2;
    public oldPos: Vector2;
    public vel: Vector2;
    public acc: Vector2;
    
    public angle: number;
    public angularVel: number;
    
    public mass: number;
    public invMass: number;
    public inertia: number;
    public invInertia: number;
    
    public restitution: number;
    public friction: number;
    public staticFriction: number;
    
    public color: string;
    public isStatic: boolean;
    public isSensor: boolean;
    public teleportCooldown: number;

    // Optional properties depending on child class shape
    public radius?: number;
    public width?: number;
    public height?: number;
    public size?: number;

    constructor(x: number, y: number, type: number) {
        this.id = Random.uuid();
        this.type = type;
        
        this.pos = { x, y };
        this.oldPos = { x, y };
        this.vel = { x: 0, y: 0 };
        this.acc = { x: 0, y: 0 };
        
        this.angle = 0;
        this.angularVel = 0;
        
        this.mass = 1;
        this.invMass = 1;
        this.inertia = 1;
        this.invInertia = 1;
        
        this.restitution = 0.5;
        this.friction = 0.5;
        this.staticFriction = 0.6;
        
        this.color = Colors.random();
        this.isStatic = false;
        this.isSensor = false;
        this.teleportCooldown = 0;
    }

    public setStatic(): void {
        this.isStatic = true;
        this.mass = 0;
        this.invMass = 0;
        this.inertia = 0;
        this.invInertia = 0;
    }

    public applyForce(fx: number, fy: number): void {
        if (this.isStatic) return;
        this.acc.x += fx * this.invMass;
        this.acc.y += fy * this.invMass;
    }

    public applyImpulse(jx: number, jy: number): void {
        if (this.isStatic) return;
        this.vel.x += jx * this.invMass;
        this.vel.y += jy * this.invMass;
    }
}
