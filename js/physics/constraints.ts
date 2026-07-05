import { PhysicsBody } from './body';
import { MathUtils } from '../utilities/math';

/**
 * DistanceConstraint
 *
 * A rigid-ish "rope segment" / joint between two physics bodies (or one body
 * and a fixed world-space anchor point), holding them at a target distance
 * apart. Solved as a positional (Baumgarte-style) correction each substep,
 * consistent with how Resolver.ts already stabilizes collision penetration —
 * this keeps the whole engine using one consistent stabilization philosophy
 * rather than mixing in a separate implicit spring integrator.
 *
 * Two bodies connected by a chain of these, each holding a short rest length,
 * approximates a rope/chain. A single constraint from a body to a static
 * anchor acts as a simple pin joint.
 */
export class DistanceConstraint {
    public bodyA: PhysicsBody;
    /** bodyB is optional; when omitted, anchorB (a fixed world point) is used instead. */
    public bodyB: PhysicsBody | null;
    public anchorB: { x: number; y: number } | null;

    public restLength: number;
    /** 0..1, how much of the positional error to correct per substep (stiffness). */
    public stiffness: number;

    constructor(
        bodyA: PhysicsBody,
        bodyBOrAnchor: PhysicsBody | { x: number; y: number },
        restLength: number,
        stiffness: number = 0.9
    ) {
        this.bodyA = bodyA;
        if (bodyBOrAnchor instanceof PhysicsBody) {
            this.bodyB = bodyBOrAnchor;
            this.anchorB = null;
        } else {
            this.bodyB = null;
            this.anchorB = bodyBOrAnchor;
        }
        this.restLength = restLength;
        this.stiffness = MathUtils.clamp(stiffness, 0, 1);
    }

    /**
     * Solve the constraint for one substep. Moves bodyA (and bodyB, if present)
     * directly toward satisfying the rest length, weighted by inverse mass so
     * heavier bodies move less. Also applies a velocity correction along the
     * constraint axis to prevent the joint from stretching under continuous load
     * (e.g. gravity pulling a rope taut).
     */
    public solve(): void {
        const pointB = this.bodyB ? this.bodyB.pos : this.anchorB!;

        const dx = pointB.x - this.bodyA.pos.x;
        const dy = pointB.y - this.bodyA.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return; // Degenerate — nothing to correct, avoid divide-by-zero

        const nx = dx / dist;
        const ny = dy / dist;
        const diff = dist - this.restLength;

        const invMassA = this.bodyA.isStatic ? 0 : this.bodyA.invMass;
        const invMassB = this.bodyB ? (this.bodyB.isStatic ? 0 : this.bodyB.invMass) : 0;
        const invMassSum = invMassA + invMassB;

        if (invMassSum === 0) return; // Both ends static/fixed — nothing can move

        const correction = diff * this.stiffness;
        const correctionA = (invMassA / invMassSum) * correction;
        const correctionB = (invMassB / invMassSum) * correction;

        if (invMassA > 0) {
            this.bodyA.pos.x += nx * correctionA;
            this.bodyA.pos.y += ny * correctionA;
        }
        if (this.bodyB && invMassB > 0) {
            this.bodyB.pos.x -= nx * correctionB;
            this.bodyB.pos.y -= ny * correctionB;
        }
    }
}