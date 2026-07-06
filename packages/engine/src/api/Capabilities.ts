export interface Capabilities {
  readonly requiresRendering?: boolean;
  readonly requiresNetworking?: boolean;
  readonly requiresViewport?: boolean;
  readonly requiresReplay?: boolean;
  readonly requiresDiagnostics?: boolean;
  readonly requiresPhysics?: boolean;
}
