import { IPlugin, PluginOutput, FrameContext } from '../api/Plugin';

export class ProfilerPlugin implements IPlugin {
  public metadata = {
    id: 'ProfilerPlugin',
    version: '1.0.0',
    capabilities: {}
  };

  private isVisible = false;
  private lastTime = 0;
  private frames = 0;
  private fps = 0;

  public beforeUpdate(context: FrameContext) {
    for (const cmd of context.commands) {
      if (cmd.type === 'ToggleProfilerOverlay') {
        this.isVisible = !this.isVisible;
      }
    }

    this.frames++;
    const now = Date.now();
    if (now - this.lastTime > 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastTime = now;
    }
  }

  public afterSnapshot(context: FrameContext): PluginOutput {
    return {
      snapshot: {
        isVisible: this.isVisible,
        fps: this.fps
      }
    };
  }
}
