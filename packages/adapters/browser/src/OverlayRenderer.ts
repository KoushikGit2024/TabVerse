import { EngineSnapshot } from '@tabverse/engine';

export class OverlayRenderer {
  // container removed as it is unused in stub

  constructor(_containerId: string) {
  }

  public render(snapshot: EngineSnapshot) {
    // Render diagnostics, performance info, etc.
    const diag = snapshot.diagnostics;
    if (diag && diag.data && diag.data.fps) {
      // update DOM elements
    }
  }
}
