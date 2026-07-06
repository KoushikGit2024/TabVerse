import { WorldGeometry, Wall, Bounds } from './WorldGeometry';

export class CollisionContext {
  constructor(private geometry: WorldGeometry) {}

  public query(bounds: Bounds): Wall[] {
    // Phase 4: Brute force query is fine until spatial grid is needed
    // We check if the wall's bounding box intersects the circle's bounding box
    const results: Wall[] = [];
    
    for (const wall of this.geometry.walls) {
      const minX = Math.min(wall.start.x, wall.end.x);
      const maxX = Math.max(wall.start.x, wall.end.x);
      const minY = Math.min(wall.start.y, wall.end.y);
      const maxY = Math.max(wall.start.y, wall.end.y);

      // AABB intersection
      if (
        bounds.maxX >= minX &&
        bounds.minX <= maxX &&
        bounds.maxY >= minY &&
        bounds.minY <= maxY
      ) {
        results.push(wall);
      }
    }
    
    return results;
  }
}
