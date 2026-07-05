import { Constants } from '../core/constants';
import { events } from '../core/events';
import { PhysicsBody } from './body';
import { CollisionManifold } from '../types/index';
import { MathUtils } from '../utilities/math';

/**
 * Advanced Impulse Resolver with Angular Velocity (Torque)
 */
export const Resolver = {
    resolve(b1: PhysicsBody, b2: PhysicsBody, manifold: CollisionManifold): void {
        const { normal, penetration, contact } = manifold;
        
        // Vectors from Center of Mass to Contact point
        const r1 = { x: contact.x - b1.pos.x, y: contact.y - b1.pos.y };
        const r2 = { x: contact.x - b2.pos.x, y: contact.y - b2.pos.y };
        
        // Relative velocities at contact point
        const v1 = { 
            x: b1.vel.x - b1.angularVel * r1.y, 
            y: b1.vel.y + b1.angularVel * r1.x 
        };
        const v2 = { 
            x: b2.vel.x - b2.angularVel * r2.y, 
            y: b2.vel.y + b2.angularVel * r2.x 
        };
        
        const rv = { x: v2.x - v1.x, y: v2.y - v1.y };
        const velAlongNormal = MathUtils.dot(rv.x, rv.y, normal.x, normal.y);

        if (velAlongNormal > 0) return;

        const e = Math.min(b1.restitution, b2.restitution);
        
        const r1CrossN = MathUtils.cross(r1.x, r1.y, normal.x, normal.y);
        const r2CrossN = MathUtils.cross(r2.x, r2.y, normal.x, normal.y);

        let invMassSum = b1.invMass + b2.invMass + 
                         (r1CrossN * r1CrossN) * b1.invInertia + 
                         (r2CrossN * r2CrossN) * b2.invInertia;

        let j = -(1 + e) * velAlongNormal;
        j /= invMassSum;

        const impulse = { x: j * normal.x, y: j * normal.y };

        b1.applyImpulse(-impulse.x, -impulse.y);
        b2.applyImpulse(impulse.x, impulse.y);

        // Apply angular impulse (torque)
        if (!b1.isStatic) b1.angularVel -= r1CrossN * j * b1.invInertia;
        if (!b2.isStatic) b2.angularVel += r2CrossN * j * b2.invInertia;

        // Friction impulse
        const t = { 
            x: rv.x - normal.x * velAlongNormal, 
            y: rv.y - normal.y * velAlongNormal 
        };
        const tLen = Math.sqrt(t.x * t.x + t.y * t.y);
        if (tLen > 0.0001) {
            t.x /= tLen;
            t.y /= tLen;
            
            let jt = -MathUtils.dot(rv.x, rv.y, t.x, t.y);
            
            const r1CrossT = MathUtils.cross(r1.x, r1.y, t.x, t.y);
            const r2CrossT = MathUtils.cross(r2.x, r2.y, t.x, t.y);
            
            const invMassSumFriction = b1.invMass + b2.invMass + 
                                      (r1CrossT * r1CrossT) * b1.invInertia + 
                                      (r2CrossT * r2CrossT) * b2.invInertia;
                                      
            jt /= invMassSumFriction;
            
            const mu = Math.sqrt(b1.friction * b1.friction + b2.friction * b2.friction);
            
            let frictionImpulse = { x: 0, y: 0 };
            if (Math.abs(jt) < j * mu) {
                frictionImpulse = { x: jt * t.x, y: jt * t.y };
            } else {
                const dynamicMu = Math.sqrt(b1.staticFriction * b1.staticFriction + b2.staticFriction * b2.staticFriction);
                frictionImpulse = { x: -j * t.x * dynamicMu, y: -j * t.y * dynamicMu };
            }
            
            b1.applyImpulse(-frictionImpulse.x, -frictionImpulse.y);
            b2.applyImpulse(frictionImpulse.x, frictionImpulse.y);
            
            if (!b1.isStatic) b1.angularVel -= r1CrossT * jt * b1.invInertia;
            if (!b2.isStatic) b2.angularVel += r2CrossT * jt * b2.invInertia;
        }

        // Baumgarte Stabilization (Positional Correction)
        const percent = 0.5; 
        const slop = 0.05; 
        const correctionMagnitude = Math.max(penetration - slop, 0) / (b1.invMass + b2.invMass) * percent;
        
        const cx = correctionMagnitude * normal.x;
        const cy = correctionMagnitude * normal.y;
        
        if (!b1.isStatic) {
            b1.pos.x -= cx * b1.invMass;
            b1.pos.y -= cy * b1.invMass;
        }
        if (!b2.isStatic) {
            b2.pos.x += cx * b2.invMass;
            b2.pos.y += cy * b2.invMass;
        }

        if (j > 50) {
            events.emit(Constants.EVENTS.COLLISION, {
                x: contact.x,
                y: contact.y,
                force: j
            });
        }
    }
};
