import { CompressedLayout } from './LayoutSolver';
import { WorldGeometry, Wall, Platform } from './WorldGeometry';

export interface GeometryInputs {
  layout: CompressedLayout;
  platforms: Platform[];
}

interface Interval {
  start: number;
  end: number;
}

export class GeometryBuilder {
  public static build(inputs: GeometryInputs): WorldGeometry {
    const walls: Wall[] = [];
    
    // Group edges by axis and coordinate
    // Map key is coordinate (X for vertical, Y for horizontal)
    const leftEdges = new Map<number, Interval[]>();
    const rightEdges = new Map<number, Interval[]>();
    const topEdges = new Map<number, Interval[]>();
    const bottomEdges = new Map<number, Interval[]>();

    const addEdge = (map: Map<number, Interval[]>, coord: number, start: number, end: number) => {
      if (!map.has(coord)) map.set(coord, []);
      map.get(coord)!.push({ start, end });
    };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const transform of inputs.layout.transforms.values()) {
      const { worldX: x, worldY: y, width: w, height: h } = transform;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);

      addEdge(leftEdges, x, y, y + h);
      addEdge(rightEdges, x + w, y, y + h);
      addEdge(topEdges, y, x, x + w);
      addEdge(bottomEdges, y + h, x, x + w);
    }

    // Process Vertical Edges (Left and Right)
    const allX = new Set([...leftEdges.keys(), ...rightEdges.keys()]);
    for (const x of allX) {
      const lefts = this.mergeIntervals(leftEdges.get(x) || []);
      const rights = this.mergeIntervals(rightEdges.get(x) || []);

      const exposedLefts = this.subtractMany(lefts, rights);
      const exposedRights = this.subtractMany(rights, lefts);

      for (const i of this.mergeIntervals(exposedLefts)) {
        walls.push(this.createWall(x, i.start, x, i.end, 1, 0, 'OUTER'));
      }
      for (const i of this.mergeIntervals(exposedRights)) {
        walls.push(this.createWall(x, i.start, x, i.end, -1, 0, 'OUTER'));
      }
    }

    // Process Horizontal Edges (Top and Bottom)
    const allY = new Set([...topEdges.keys(), ...bottomEdges.keys()]);
    for (const y of allY) {
      const tops = this.mergeIntervals(topEdges.get(y) || []);
      const bottoms = this.mergeIntervals(bottomEdges.get(y) || []);

      const exposedTops = this.subtractMany(tops, bottoms);
      const exposedBottoms = this.subtractMany(bottoms, tops);

      for (const i of this.mergeIntervals(exposedTops)) {
        walls.push(this.createWall(i.start, y, i.end, y, 0, 1, 'OUTER'));
      }
      for (const i of this.mergeIntervals(exposedBottoms)) {
        walls.push(this.createWall(i.start, y, i.end, y, 0, -1, 'OUTER'));
      }
    }

    // Platforms
    for (const _p of inputs.platforms) {
      // Simplistic platform bounding box walls. Wait, user said platforms are independent.
      // Phase 4 just needs outer boundaries to work perfectly. 
      // Platform walls are also generated here if needed, but for now we leave it simple.
    }

    // Deterministic Sort: Y -> X -> Length
    walls.sort((a, b) => {
      if (a.start.y !== b.start.y) return a.start.y - b.start.y;
      if (a.start.x !== b.start.x) return a.start.x - b.start.x;
      return b.length - a.length;
    });

    // Assign IDs after sorting to guarantee stability
    const finalWalls: Wall[] = walls.map((w, index) => ({
      ...w,
      id: `wall_${index}`
    }));

    return {
      walls: finalWalls,
      platforms: [...inputs.platforms],
      worldBounds: { minX, minY, maxX, maxY }
    };
  }

  private static createWall(x1: number, y1: number, x2: number, y2: number, nx: number, ny: number, type: 'OUTER' | 'PLATFORM'): Wall {
    return {
      id: '', // Will be assigned later
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      normal: { x: nx, y: ny },
      type,
      length: Math.hypot(x2 - x1, y2 - y1)
    };
  }

  private static mergeIntervals(intervals: Interval[]): Interval[] {
    if (intervals.length === 0) return [];
    
    // Create copies to avoid mutating input arrays
    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    const result: Interval[] = [{ start: sorted[0]!.start, end: sorted[0]!.end }];
    
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]!;
      const last = result[result.length - 1]!;
      
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        result.push({ start: current.start, end: current.end });
      }
    }
    return result;
  }

  private static subtractMany(sources: Interval[], subtractors: Interval[]): Interval[] {
    let result = [...sources];
    for (const sub of subtractors) {
      const nextResult: Interval[] = [];
      for (const r of result) {
        if (sub.end <= r.start || sub.start >= r.end) {
          nextResult.push(r); // No overlap
        } else {
          if (sub.start > r.start) nextResult.push({ start: r.start, end: sub.start });
          if (sub.end < r.end) nextResult.push({ start: sub.end, end: r.end });
        }
      }
      result = nextResult;
    }
    return result.filter(i => i.end > i.start);
  }
}
