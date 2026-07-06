export interface IRenderer {
  beginFrame(): void;
  endFrame(): void;
  drawRect(x: number, y: number, width: number, height: number, color: string): void;
  drawLine(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth?: number): void;
  drawText(text: string, x: number, y: number, color: string, font?: string): void;
  drawCircle(x: number, y: number, radius: number, color: string): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  restoreTransform(): void;
}

export interface IEngineDiagnosticsContext {
  readonly currentLayout?: any;
  readonly currentGraph?: any;
  readonly adapter?: any;
}

export interface CircleCollider {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}
