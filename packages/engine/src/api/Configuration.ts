export interface PhysicsConfig {
  readonly gravity: number;
  readonly maxVelocity: number;
}

export interface NetworkConfig {
  readonly heartbeatIntervalMs: number;
  readonly peerTimeoutMs: number;
}

export interface TopologyConfig {
  readonly snapTolerance: number;
  readonly minimumOverlap: number;
}

export interface DiagnosticsConfig {
  readonly enabled: boolean;
}

export interface EngineConfig {
  readonly version: 1;
  readonly physics: PhysicsConfig;
  readonly network: NetworkConfig;
  readonly topology: TopologyConfig;
  readonly diagnostics: DiagnosticsConfig;
}
