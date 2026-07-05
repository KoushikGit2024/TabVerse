import { Config } from '../core/config';
import { sync } from './sync';
import { SerializedPhysicsObject } from '../types/index';
import { MathUtils } from '../utilities/math';

/**
 * Interpolator
 *
 * Client tabs (non-owners) only receive world state at `syncRate` Hz (default
 * 30), which is lower than the render/physics loop's frame rate. Without
 * interpolation, objects visibly "jump" between network updates, and any drop
 * in sync rate (temporary tab throttling, a busy owner tab, etc.) makes this
 * worse. This module buffers the two most recent snapshots and blends between
 * them based on elapsed wall-clock time, falling back to gentle extrapolation
 * using each object's last known velocity if a new packet is late.
 *
 * We deliberately render slightly in the past (one syncRate interval behind
 * "now") rather than trying to extrapolate all the way to the present — this
 * is the standard "interpolation delay" approach used in networked games,
 * and avoids visible overshoot/correction snapping when a real packet arrives.
 */
class Interpolator {
    /** How far in the past (ms) we intentionally render, to always have two real snapshots to blend between. */
    private get renderDelayMs(): number {
        return 1000 / Config.network.syncRate;
    }

    /**
     * Returns the best-estimate object list for "now minus renderDelayMs",
     * blending between the two snapshots that bracket that target time. If
     * fewer than 2 snapshots exist yet, returns the most recent one verbatim
     * (or an empty array if none have arrived).
     */
    public getInterpolatedObjects(): SerializedPhysicsObject[] {
        const buffer = sync.stateBuffer;
        if (buffer.length === 0) return [];
        if (buffer.length === 1) return buffer[0]!.objects;

        const targetTime = performance.now() - this.renderDelayMs;

        // Find the two snapshots that bracket targetTime: `older` <= targetTime <= `newer`.
        let older = buffer[0]!;
        let newer = buffer[1]!;
        for (let i = 0; i < buffer.length - 1; i++) {
            const a = buffer[i]!;
            const b = buffer[i + 1]!;
            if (a.timestamp <= targetTime && targetTime <= b.timestamp) {
                older = a;
                newer = b;
                break;
            }
            // If target is newer than everything we have, keep the last pair
            // so we extrapolate slightly forward from the two most recent frames.
            older = a;
            newer = b;
        }

        const span = newer.timestamp - older.timestamp;
        const t = span > 0 ? MathUtils.clamp((targetTime - older.timestamp) / span, 0, 1.5) : 0;
        // Note: t is allowed to slightly exceed 1.0 (up to 1.5) to permit mild
        // extrapolation beyond the newest snapshot when packets are late,
        // rather than freezing objects in place.

        return this.blend(older.objects, newer.objects, t);
    }

    private blend(
        from: SerializedPhysicsObject[],
        to: SerializedPhysicsObject[],
        t: number
    ): SerializedPhysicsObject[] {
        const fromMap = new Map(from.map(o => [o.id, o]));
        const result: SerializedPhysicsObject[] = [];

        for (const toObj of to) {
            const fromObj = fromMap.get(toObj.id);
            if (!fromObj) {
                // Newly spawned object with no prior frame to blend from — show it as-is.
                result.push(toObj);
                continue;
            }

            const blended: SerializedPhysicsObject = {
                id: toObj.id,
                t: toObj.t,
                x: MathUtils.lerp(fromObj.x, toObj.x, t),
                y: MathUtils.lerp(fromObj.y, toObj.y, t),
                a: MathUtils.lerp(fromObj.a, toObj.a, t),
                vx: toObj.vx,
                vy: toObj.vy,
                c: toObj.c,
                s: toObj.s
            };
            // exactOptionalPropertyTypes requires omitting these keys entirely
            // rather than assigning `undefined` when the source object lacks them.
            if (toObj.w !== undefined) blended.w = toObj.w;
            if (toObj.h !== undefined) blended.h = toObj.h;

            result.push(blended);
        }

        return result;
    }
}

export const interpolator = new Interpolator();