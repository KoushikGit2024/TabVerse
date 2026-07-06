import { IPlugin, PluginOutput, FrameContext } from '../api/Plugin';
import { EngineSnapshot } from '../api/Snapshot';
import { ServiceRegistry } from '../api/ServiceRegistry';

export class SnapshotPlugin implements IPlugin {
  public metadata = {
    id: 'SnapshotPlugin',
    version: '1.0.0',
    capabilities: {},
    priority: -100 // Runs last
  };

  private latestSnapshot: EngineSnapshot | null = null;
  // allPluginOutputs removed

  public initialize(registry: ServiceRegistry) {
    registry.register('SnapshotProvider', this);
  }

  // During afterSnapshot, we collect from other plugins
  public afterSnapshot(_context: FrameContext): PluginOutput {
    // Other plugins have already run afterSnapshot because this runs last.
    // Actually, in PluginManager we collected outputs. 
    // It's cleaner if PluginManager passes the collected outputs to SnapshotBuilder.
    // Or we just assemble it in Engine.ts for now, as Engine has the outputs.
    return {
      snapshot: { type: 'MetaSnapshot', timestamp: Date.now() }
    };
  }

  public getSnapshot(): EngineSnapshot | null {
    return this.latestSnapshot;
  }
}
