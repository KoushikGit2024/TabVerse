import { IInputMapper, EngineCommand } from '@tabverse/engine';

export class BrowserInputMapper implements IInputMapper {
  private queue: EngineCommand[] = [];

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'F3') {
      e.preventDefault();
      this.queue.push({ type: 'ToggleDebugOverlay' });
    }
    if (e.key === 'F4') {
      e.preventDefault();
      this.queue.push({ type: 'ToggleTopologyOverlay' });
    }
    if (e.key === 'F5') {
      e.preventDefault();
      this.queue.push({ type: 'ToggleProfilerOverlay' });
    }
    if (e.key === 'r') {
      this.queue.push({ type: 'SpawnEntity' });
    }
  }

  public poll(): EngineCommand[] {
    const commands = [...this.queue];
    this.queue = [];
    return commands;
  }
}
