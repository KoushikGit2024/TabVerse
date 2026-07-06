import { IPlugin, PluginOutput, FrameContext } from '../api/Plugin';
import { EngineCommand } from '../api/Command';

export class TopologyPlugin implements IPlugin {
  public metadata = {
    id: 'TopologyPlugin',
    version: '1.0.0',
    capabilities: {}
  };

  private isVisible = false;
  private topologyData: any = {};

  public beforeUpdate(context: FrameContext) {
    for (const cmd of context.commands) {
      if (cmd.type === 'ToggleTopologyOverlay') {
        this.isVisible = !this.isVisible;
      }
    }
  }

  public afterSnapshot(context: FrameContext): PluginOutput {
    return {
      snapshot: {
        isVisible: this.isVisible,
        data: this.topologyData
      }
    };
  }
}
