import { TopologyConfig } from '../api/Configuration';

export interface DesktopBounds {
  id: string;
  screenX: number;
  screenY: number;
  outerWidth: number;
  outerHeight: number;
  innerWidth: number;
  innerHeight: number;
}

export type EdgeDirection = 'RIGHT' | 'BOTTOM' | 'LEFT' | 'TOP';

export interface TopologyEdge {
  sourceId: string;
  targetId: string;
  direction: EdgeDirection;
}

export interface TopologyGraph {
  nodes: DesktopBounds[];
  edges: TopologyEdge[];
  islands: string[][]; // Array of connected component arrays (list of node IDs)
}

export class TopologyManager {
  /**
   * Pass 1 - Pure Function
   * Computes adjacency graph and connected components from physical desktop bounds.
   */
  public static buildTopology(viewports: DesktopBounds[], config: TopologyConfig): TopologyGraph {
    const nodes = [...viewports];
    const edges: TopologyEdge[] = [];
    const { snapTolerance, minimumOverlap } = config;

    // Detect edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;

        const a = nodes[i]!;
        const b = nodes[j]!;

        // Is B to the right of A?
        const isRight = 
          Math.abs((a.screenX + a.outerWidth) - b.screenX) <= snapTolerance &&
          a.screenY < b.screenY + b.outerHeight - minimumOverlap &&
          a.screenY + a.outerHeight > b.screenY + minimumOverlap;
          
        if (isRight) {
          edges.push({ sourceId: a.id, targetId: b.id, direction: 'RIGHT' });
        }

        // Is B below A?
        const isBottom = 
          Math.abs((a.screenY + a.outerHeight) - b.screenY) <= snapTolerance &&
          a.screenX < b.screenX + b.outerWidth - minimumOverlap &&
          a.screenX + a.outerWidth > b.screenX + minimumOverlap;
          
        if (isBottom) {
          edges.push({ sourceId: a.id, targetId: b.id, direction: 'BOTTOM' });
        }
      }
    }

    // Connected Components (Islands)
    const adj = new Map<string, string[]>();
    nodes.forEach(n => adj.set(n.id, []));
    
    // Build undirected adjacency for component search
    for (const edge of edges) {
      adj.get(edge.sourceId)!.push(edge.targetId);
      adj.get(edge.targetId)!.push(edge.sourceId);
    }

    const visited = new Set<string>();
    const islands: string[][] = [];

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        const island: string[] = [];
        const queue = [node.id];
        visited.add(node.id);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          island.push(curr);

          for (const neighbor of adj.get(curr)!) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }
        islands.push(island);
      }
    }

    return { nodes, edges, islands };
  }
}
