import { ServiceRegistry } from '../api/ServiceRegistry';
import { IPlugin, FrameContext } from '../api/Plugin';
import { IInputMapper } from '../api/Command';
import { EngineSnapshot } from '../api/Snapshot';
import { PluginManager } from './PluginManager';
import { ActionDispatcher } from './ActionDispatcher';

export class Engine {
  public registry: ServiceRegistry;
  private inputMappers: IInputMapper[];
  private pluginManager: PluginManager;
  private actionDispatcher: ActionDispatcher;
  private currentFrame: number = 0;
  private latestSnapshot: EngineSnapshot | null = null;

  constructor(
    registry: ServiceRegistry,
    inputMappers: IInputMapper[],
    plugins: IPlugin[]
  ) {
    this.registry = registry;
    this.inputMappers = inputMappers;
    this.actionDispatcher = new ActionDispatcher();
    this.pluginManager = new PluginManager(registry);

    for (const plugin of plugins) {
      this.pluginManager.addPlugin(plugin);
    }

    this.pluginManager.initialize();
  }

  public tick(dt: number): EngineSnapshot {
    this.currentFrame++;

    // 1. Collect inputs
    for (const mapper of this.inputMappers) {
      this.actionDispatcher.ingest(mapper.poll());
    }

    // 2. Dispatch commands
    const commands = this.actionDispatcher.flush();

    // 3. Create context
    const context: FrameContext = {
      frame: this.currentFrame,
      dt,
      commands,
      world: {} // To be populated by WorldPlugin later
    };

    // 4. Update lifecycle
    this.pluginManager.beforeUpdate(context);
    this.pluginManager.fixedUpdate(context); // Could loop based on accumulated time in the future
    this.pluginManager.update(context);
    this.pluginManager.lateUpdate(context);

    // 5. Build snapshots
    const pluginSnapshots = this.pluginManager.buildSnapshots(context);

    // 6. Assemble final EngineSnapshot
    // Note: The SnapshotPlugin could also handle this assembly in the future
    this.latestSnapshot = {
      version: 1,
      frame: this.currentFrame,
      timestamp: Date.now(), // or context.clock.now()
      world: pluginSnapshots.find(p => p.pluginId === 'WorldPlugin')?.data || { id: 'default', bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } },
      geometry: pluginSnapshots.find(p => p.pluginId === 'GeometryPlugin')?.data || { id: 'default', walls: [] },
      cameras: pluginSnapshots.find(p => p.pluginId === 'ViewportPlugin')?.data || [],
      entities: pluginSnapshots.find(p => p.pluginId === 'SimulationPlugin')?.data || [],
      diagnostics: pluginSnapshots.find(p => p.pluginId === 'DiagnosticsPlugin')?.data || { id: 'default', data: {} },
      plugins: pluginSnapshots
    };

    return this.latestSnapshot;
  }

  public get snapshot(): EngineSnapshot | null {
    return this.latestSnapshot;
  }

  public shutdown(): void {
    this.pluginManager.shutdown();
  }
}
