import { Box } from './Box';
import { DistanceConstraint } from '../physics/constraints';
import { Colors } from '../utilities/colors';

/** Visual/physical size of a single rope link. */
const SEGMENT_SIZE = 16;
/** Gap tolerance so segments don't perfectly overlap (rest length between centers). */
const SEGMENT_REST_LENGTH = SEGMENT_SIZE * 1.1;

export interface RopeBuildResult {
    segments: Box[];
    constraints: DistanceConstraint[];
}

/**
 * Builds a chain of `count` small Box segments starting at (x, y) and hanging
 * downward, each one linked to the next by a DistanceConstraint. The first
 * segment is pinned in place (made static) so the rope hangs from a fixed
 * point, like an anchored chain swinging under gravity.
 */
export function buildRope(x: number, y: number, count: number): RopeBuildResult {
    const segments: Box[] = [];
    const constraints: DistanceConstraint[] = [];

    const color = Colors.random();

    for (let i = 0; i < count; i++) {
        const seg = new Box(x, y + i * SEGMENT_REST_LENGTH, SEGMENT_SIZE, SEGMENT_SIZE);
        seg.color = color;
        seg.friction = 0.2;
        seg.restitution = 0.1;

        if (i === 0) {
            // Anchor point: fixed in place so the rope has something to hang from.
            seg.setStatic();
        }

        segments.push(seg);

        if (i > 0) {
            const prev = segments[i - 1]!;
            constraints.push(new DistanceConstraint(prev, seg, SEGMENT_REST_LENGTH, 0.9));
        }
    }

    return { segments, constraints };
}