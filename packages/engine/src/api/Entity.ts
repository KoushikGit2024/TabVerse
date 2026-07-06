export interface Component {
  readonly type: string;
}

export interface TransformComponent extends Component {
  readonly type: 'Transform';
  x: number;
  y: number;
  rotation: number;
}

export interface PhysicsComponent extends Component {
  readonly type: 'Physics';
  vx: number;
  vy: number;
  mass: number;
}

export interface ColliderComponent extends Component {
  readonly type: 'Collider';
  shape: 'circle' | 'rectangle';
  radius?: number;
  width?: number;
  height?: number;
}

export interface Entity {
  readonly id: string;
  readonly components: Map<string, Component>;
}
