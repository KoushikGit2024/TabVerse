import { IPlugin, PluginOutput, FrameContext } from '../api/Plugin';

export class ReplayPlugin implements IPlugin {
  public metadata = {
    id: 'ReplayPlugin',
    version: '1.0.0',
    capabilities: {}
  };

  public afterSnapshot(context: FrameContext): PluginOutput {
    return {
      snapshot: {
        // Replay specific data
      }
    };
  }
}
