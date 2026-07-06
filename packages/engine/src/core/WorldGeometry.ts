export type WallType = 'OUTER' | 'PLATFORM';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Wall {
  readonly id: string;
  readonly start: Vec2;
  readonly end: Vec2;
  readonly normal: Vec2;
  readonly type: WallType;
  readonly length: number;
}

export interface Platform {
  readonly id: string;
  readonly bounds: Bounds;
}

export interface WorldGeometry {
  readonly walls: Wall[];
  readonly platforms: Platform[];
  readonly worldBounds: Bounds;
}
