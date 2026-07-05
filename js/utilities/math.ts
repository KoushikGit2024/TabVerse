/**
 * Math Utilities
 */
export const MathUtils = {
    /**
     * Clamp a number between a minimum and maximum value
     */
    clamp: (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max),

    /**
     * Linear interpolation
     */
    lerp: (a: number, b: number, t: number): number => a + (b - a) * t,

    /**
     * Distance between two points (squared, for performance)
     */
    distanceSq: (x1: number, y1: number, x2: number, y2: number): number => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    },

    /**
     * Distance between two points
     */
    distance: (x1: number, y1: number, x2: number, y2: number): number => Math.sqrt(MathUtils.distanceSq(x1, y1, x2, y2)),

    /**
     * Vector dot product
     */
    dot: (x1: number, y1: number, x2: number, y2: number): number => x1 * x2 + y1 * y2,

    /**
     * Vector cross product (2D scalar)
     */
    cross: (x1: number, y1: number, x2: number, y2: number): number => x1 * y2 - y1 * x2
};
