import { Wall, Vec2 } from './WorldGeometry';

export interface CollisionResult {
  hit: boolean;
  t: number;        // Time of impact (0.0 to 1.0)
  point: Vec2;      // Exact coordinate of impact
  normal: Vec2;     // Normal of the hit wall
  wall: Wall | null;
}

export class SweptCollision {
  public static testCircleVsWall(
    startX: number, startY: number,
    endX: number, endY: number,
    radius: number,
    wall: Wall
  ): CollisionResult {
    // Inflate wall by radius along its normal
    const inflatedStartX = wall.start.x + wall.normal.x * radius;
    const inflatedStartY = wall.start.y + wall.normal.y * radius;
    const inflatedEndX = wall.end.x + wall.normal.x * radius;
    const inflatedEndY = wall.end.y + wall.normal.y * radius;

    const dx = endX - startX;
    const dy = endY - startY;

    const wx = inflatedEndX - inflatedStartX;
    const wy = inflatedEndY - inflatedStartY;

    const cross = dx * wy - dy * wx;

    if (Math.abs(cross) < 0.0001) {
      return { hit: false, t: 1.0, point: {x:0, y:0}, normal: {x:0,y:0}, wall: null };
    }

    const t = ((inflatedStartX - startX) * wy - (inflatedStartY - startY) * wx) / cross;
    const u = ((inflatedStartX - startX) * dy - (inflatedStartY - startY) * dx) / cross;

    // t in [0, 1] means it hits during this frame
    // u in [0, 1] means it hits within the segment bounds
    // We add a tiny epsilon to u bounds to prevent edge snagging where floating point errors 
    // might let a ball slip exactly between collinear segments.
    if (t >= 0 && t <= 1.0001 && u >= -0.0001 && u <= 1.0001) {
      // Must be moving into the wall (front face only)
      const dot = (dx * wall.normal.x + dy * wall.normal.y);
      if (dot < 0) {
        return {
          hit: true,
          t: Math.max(0, t), // clamp
          point: {
            x: startX + t * dx,
            y: startY + t * dy
          },
          normal: wall.normal,
          wall
        };
      }
    }

    return { hit: false, t: 1.0, point: {x:0, y:0}, normal: {x:0,y:0}, wall: null };
  }
}
