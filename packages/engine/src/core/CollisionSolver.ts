import { CollisionContext } from './CollisionContext';
import { SweptCollision, CollisionResult } from './SweptCollision';
import { CircleCollider } from '../api/Types'; // Or Entity types later

export class CollisionSolver {
  constructor() {}

  public resolveBallCollisions(
    ball: CircleCollider, 
    dt: number, 
    context: CollisionContext,
    _simulationTime: number
  ) {
    const sec = dt / 1000;
    
    let remainingTime = sec;
    const maxBounces = 3;
    let bounces = 0;

    while (remainingTime > 0.0001 && bounces < maxBounces) {
      const targetX = ball.x + ball.vx * remainingTime;
      const targetY = ball.y + ball.vy * remainingTime;

      // Query geometry
      // The radius bounds check expands the query area
      const queryBounds = {
        minX: Math.min(ball.x, targetX) - ball.radius,
        maxX: Math.max(ball.x, targetX) + ball.radius,
        minY: Math.min(ball.y, targetY) - ball.radius,
        maxY: Math.max(ball.y, targetY) + ball.radius,
      };

      const walls = context.query(queryBounds);

      let earliestHit: CollisionResult | null = null;

      for (const wall of walls) {
        const hit = SweptCollision.testCircleVsWall(
          ball.x, ball.y, 
          targetX, targetY, 
          ball.radius, 
          wall
        );

        if (hit.hit) {
          if (!earliestHit || hit.t < earliestHit.t) {
            earliestHit = hit;
          }
        }
      }

      if (earliestHit && earliestHit.hit && earliestHit.wall) {
        // Move ball to exact point of impact
        ball.x = earliestHit.point.x;
        ball.y = earliestHit.point.y;
        
        // Reflect velocity across normal
        // V = V - 2 * (V . N) * N
        const dot = ball.vx * earliestHit.normal.x + ball.vy * earliestHit.normal.y;
        ball.vx -= 2 * dot * earliestHit.normal.x;
        ball.vy -= 2 * dot * earliestHit.normal.y;
        
        // Consume time
        remainingTime *= (1 - earliestHit.t);

        // (Diagnostic events could be returned here instead of emitted directly)

        bounces++;
      } else {
        // No collision, move completely
        ball.x = targetX;
        ball.y = targetY;
        remainingTime = 0;
      }
    }
  }
}
