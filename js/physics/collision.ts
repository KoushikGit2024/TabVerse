import { Constants } from '../core/constants';
import { PhysicsBody } from './body';
import { CollisionManifold, Vector2 } from '../types/index';
import { MathUtils } from '../utilities/math';
import { Box } from '../objects/Box';

/**
 * Advanced Collision Detection (SAT)
 */
export const Collision = {
    check(b1: PhysicsBody, b2: PhysicsBody): CollisionManifold | null {
        if (b1.type === Constants.TYPES.BALL && b2.type === Constants.TYPES.BALL) {
            return this.circleCircle(b1, b2);
        }
        
        if (b1.type === Constants.TYPES.BOX && b2.type === Constants.TYPES.BOX) {
            return this.boxBox(b1 as Box, b2 as Box);
        }

        if (b1.type === Constants.TYPES.BOX && b2.type === Constants.TYPES.BALL) {
            return this.boxCircle(b1 as Box, b2);
        }
        if (b1.type === Constants.TYPES.BALL && b2.type === Constants.TYPES.BOX) {
            const manifold = this.boxCircle(b2 as Box, b1);
            if (manifold) {
                manifold.normal.x *= -1;
                manifold.normal.y *= -1;
            }
            return manifold;
        }

        return null;
    },

    circleCircle(c1: PhysicsBody, c2: PhysicsBody): CollisionManifold | null {
        const dx = c2.pos.x - c1.pos.x;
        const dy = c2.pos.y - c1.pos.y;
        const distSq = dx * dx + dy * dy;
        const radii = c1.radius! + c2.radius!;

        if (distSq < radii * radii) {
            const dist = Math.sqrt(distSq);
            let nx = 0, ny = 1; 
            if (dist > 0) {
                nx = dx / dist;
                ny = dy / dist;
            }
            
            // Contact point is between the centers
            const contact: Vector2 = {
                x: c1.pos.x + nx * c1.radius!,
                y: c1.pos.y + ny * c1.radius!
            };

            return {
                normal: { x: nx, y: ny },
                penetration: radii - dist,
                contact
            };
        }
        return null;
    },

    boxBox(box1: Box, box2: Box): CollisionManifold | null {
        const verts1 = box1.getVertices();
        const verts2 = box2.getVertices();
        
        const axes = [
            ...this.getAxes(verts1),
            ...this.getAxes(verts2)
        ];

        let minOverlap = Infinity;
        let smallestAxis: Vector2 = { x: 0, y: 0 };

        for (const axis of axes) {
            const proj1 = this.projectVertices(verts1, axis);
            const proj2 = this.projectVertices(verts2, axis);

            const overlap = Math.min(proj1.max, proj2.max) - Math.max(proj1.min, proj2.min);

            if (overlap <= 0) {
                return null; // Separating axis found
            }

            if (overlap < minOverlap) {
                minOverlap = overlap;
                smallestAxis = axis;
            }
        }

        // Ensure normal points from box1 to box2
        const dx = box2.pos.x - box1.pos.x;
        const dy = box2.pos.y - box1.pos.y;
        if (dx * smallestAxis.x + dy * smallestAxis.y < 0) {
            smallestAxis.x *= -1;
            smallestAxis.y *= -1;
        }
        
        // Very basic contact point approximation (average of colliding vertices)
        let cx = 0, cy = 0, count = 0;
        for (const v1 of verts1) {
            if (this.isPointInBox(v1, box2)) { cx += v1.x; cy += v1.y; count++; }
        }
        for (const v2 of verts2) {
            if (this.isPointInBox(v2, box1)) { cx += v2.x; cy += v2.y; count++; }
        }
        
        const contact: Vector2 = count > 0 
            ? { x: cx / count, y: cy / count } 
            : { x: box1.pos.x + smallestAxis.x * (box1.width! / 2), y: box1.pos.y + smallestAxis.y * (box1.height! / 2) };

        return {
            normal: smallestAxis,
            penetration: minOverlap,
            contact
        };
    },
    
    boxCircle(box: Box, circle: PhysicsBody): CollisionManifold | null {
        // Transform circle center to box local space
        const cos = Math.cos(-box.angle);
        const sin = Math.sin(-box.angle);
        const dx = circle.pos.x - box.pos.x;
        const dy = circle.pos.y - box.pos.y;
        
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        const hw = box.width! / 2;
        const hh = box.height! / 2;
        
        let closestX = MathUtils.clamp(localX, -hw, hw);
        let closestY = MathUtils.clamp(localY, -hh, hh);
        
        let isInside = false;
        // If circle center is inside box
        if (localX === closestX && localY === closestY) {
            isInside = true;
            if (Math.abs(localX) > Math.abs(localY)) {
                closestX = closestX > 0 ? hw : -hw;
            } else {
                closestY = closestY > 0 ? hh : -hh;
            }
        }
        
        // Transform closest point back to world space
        const invCos = Math.cos(box.angle);
        const invSin = Math.sin(box.angle);
        const worldX = box.pos.x + (closestX * invCos - closestY * invSin);
        const worldY = box.pos.y + (closestX * invSin + closestY * invCos);
        
        const cdx = circle.pos.x - worldX;
        const cdy = circle.pos.y - worldY;
        const distSq = cdx * cdx + cdy * cdy;
        const rSq = circle.radius! * circle.radius!;
        
        if (distSq < rSq || isInside) {
            const dist = Math.sqrt(distSq);
            let nx = cdx / (dist || 1);
            let ny = cdy / (dist || 1);
            
            if (isInside) {
                nx *= -1;
                ny *= -1;
            }
            
            return {
                normal: { x: nx, y: ny },
                penetration: circle.radius! - dist,
                contact: { x: worldX, y: worldY }
            };
        }
        
        return null;
    },

    getAxes(vertices: Vector2[]): Vector2[] {
        const axes: Vector2[] = [];
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i]!;
            const p2 = vertices[(i + 1) % vertices.length]!;
            const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
            const length = Math.sqrt(edge.x * edge.x + edge.y * edge.y);
            // Normal is edge rotated by 90 degrees
            axes.push({ x: -edge.y / length, y: edge.x / length });
        }
        return axes;
    },

    projectVertices(vertices: Vector2[], axis: Vector2) {
        let min = MathUtils.dot(vertices[0]!.x, vertices[0]!.y, axis.x, axis.y);
        let max = min;
        for (let i = 1; i < vertices.length; i++) {
            const proj = MathUtils.dot(vertices[i]!.x, vertices[i]!.y, axis.x, axis.y);
            if (proj < min) min = proj;
            if (proj > max) max = proj;
        }
        return { min, max };
    },

    isPointInBox(p: Vector2, box: Box): boolean {
        const cos = Math.cos(-box.angle);
        const sin = Math.sin(-box.angle);
        const dx = p.x - box.pos.x;
        const dy = p.y - box.pos.y;
        
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        const hw = box.width! / 2;
        const hh = box.height! / 2;
        return localX >= -hw && localX <= hw && localY >= -hh && localY <= hh;
    }
};
