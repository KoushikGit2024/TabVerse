export interface WorldSnapshot {
  readonly id: string;
  readonly bounds: { readonly minX: number; readonly minY: number; readonly maxX: number; readonly maxY: number };
}

export interface CameraSnapshot {
  readonly id: string;
  readonly worldX: number;
  readonly worldY: number;
  readonly width: number;
  readonly height: number;
}

export interface GeometrySnapshot {
  readonly id: string;
  readonly walls: readonly any[]; // Will type this properly later
}

export interface EntitySnapshot {
  readonly id: string;
  readonly components: readonly any[]; // Will type this properly later
}

export interface DiagnosticsSnapshot {
  readonly id: string;
  readonly data: any;
}

export interface PluginSnapshot {
  readonly pluginId: string;
  readonly data: any;
}

export interface EngineSnapshot {
  readonly version: 1;
  readonly frame: number;
  readonly timestamp: number;
  
  readonly world: WorldSnapshot;
  readonly cameras: readonly CameraSnapshot[];
  readonly geometry: GeometrySnapshot;
  readonly entities: readonly EntitySnapshot[];
  readonly diagnostics: DiagnosticsSnapshot;
  readonly plugins: readonly PluginSnapshot[];
}
