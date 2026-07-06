import { TopologyGraph, DesktopBounds } from './TopologyManager';

export interface ViewportTransform {
  worldX: number;
  worldY: number;
  width: number;
  height: number;
}

export interface CompressedLayout {
  transforms: Map<string, ViewportTransform>;
  inconsistencies: string[]; // Debug warnings for cyclic errors
}

export class LayoutSolver {
  /**
   * Pass 2 - Pure Function
   * Computes the compressed world coordinates for all viewports from the TopologyGraph.
   */
  public static solveLayout(graph: TopologyGraph, cycleConsistencyEpsilon: number = 5): CompressedLayout {
    const transforms = new Map<string, ViewportTransform>();
    const inconsistencies: string[] = [];

    const nodeMap = new Map<string, DesktopBounds>();
    graph.nodes.forEach(n => nodeMap.set(n.id, n));

    // Build directed adjacency for BFS (we need to be able to traverse both ways)
    // If A -> B (RIGHT), then traversing A to B sets B.x = A.x + A.innerWidth
    // Traversing B to A sets A.x = B.x - A.innerWidth
    
    interface TraversalEdge {
      targetId: string;
      direction: 'RIGHT' | 'BOTTOM' | 'LEFT' | 'TOP';
    }
    
    const adj = new Map<string, TraversalEdge[]>();
    graph.nodes.forEach(n => adj.set(n.id, []));

    for (const edge of graph.edges) {
      adj.get(edge.sourceId)!.push({ targetId: edge.targetId, direction: edge.direction });
      
      const reverseDir = 
        edge.direction === 'RIGHT' ? 'LEFT' :
        edge.direction === 'LEFT' ? 'RIGHT' :
        edge.direction === 'BOTTOM' ? 'TOP' : 'BOTTOM';
        
      adj.get(edge.targetId)!.push({ targetId: edge.sourceId, direction: reverseDir });
    }

    for (const island of graph.islands) {
      // 1. Root Selection
      // Lexicographical sort: desktopY, desktopX, id
      const rootId = [...island].sort((idA, idB) => {
        const a = nodeMap.get(idA)!;
        const b = nodeMap.get(idB)!;
        if (a.screenY !== b.screenY) return a.screenY - b.screenY;
        if (a.screenX !== b.screenX) return a.screenX - b.screenX;
        return a.id.localeCompare(b.id);
      })[0];

      if (!rootId) continue;

      const root = nodeMap.get(rootId)!;

      // 2. Anchor
      transforms.set(rootId, {
        worldX: root.screenX,
        worldY: root.screenY,
        width: root.innerWidth,
        height: root.innerHeight
      });

      // 3. Graph Traversal (BFS)
      const queue = [rootId];

      while (queue.length > 0) {
        const currId = queue.shift()!;
        const currTrans = transforms.get(currId)!;
        const currNode = nodeMap.get(currId)!;

        for (const edge of adj.get(currId)!) {
          const targetId = edge.targetId;
          const targetNode = nodeMap.get(targetId)!;
          
          let impliedX = currTrans.worldX;
          let impliedY = currTrans.worldY;

          if (edge.direction === 'RIGHT') {
            impliedX = currTrans.worldX + currNode.innerWidth;
            impliedY = currTrans.worldY + (targetNode.screenY - currNode.screenY);
          } else if (edge.direction === 'LEFT') {
            impliedX = currTrans.worldX - targetNode.innerWidth;
            impliedY = currTrans.worldY + (targetNode.screenY - currNode.screenY);
          } else if (edge.direction === 'BOTTOM') {
            impliedX = currTrans.worldX + (targetNode.screenX - currNode.screenX);
            impliedY = currTrans.worldY + currNode.innerHeight;
          } else if (edge.direction === 'TOP') {
            impliedX = currTrans.worldX + (targetNode.screenX - currNode.screenX);
            impliedY = currTrans.worldY - targetNode.innerHeight;
          }

          if (transforms.has(targetId)) {
            // Cycle Consistency Check
            const existing = transforms.get(targetId)!;
            const diffX = Math.abs(existing.worldX - impliedX);
            const diffY = Math.abs(existing.worldY - impliedY);
            if (diffX > cycleConsistencyEpsilon || diffY > cycleConsistencyEpsilon) {
              inconsistencies.push(`Cycle mismatch at ${targetId}: Existing(${existing.worldX},${existing.worldY}) vs Implied(${impliedX},${impliedY})`);
            }
          } else {
            // 4. Coordinate Assignment
            transforms.set(targetId, {
              worldX: impliedX,
              worldY: impliedY,
              width: targetNode.innerWidth,
              height: targetNode.innerHeight
            });
            queue.push(targetId);
          }
        }
      }
    }

    return { transforms, inconsistencies };
  }
}
