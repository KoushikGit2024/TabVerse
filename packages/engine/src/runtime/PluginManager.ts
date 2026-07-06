import { IPlugin, FrameContext } from '../api/Plugin';
import { ServiceRegistry } from '../api/ServiceRegistry';

export class PluginManager {
  private plugins: IPlugin[] = [];
  private registry: ServiceRegistry;

  constructor(registry: ServiceRegistry) {
    this.registry = registry;
  }

  public addPlugin(plugin: IPlugin): void {
    this.plugins.push(plugin);
  }

  public initialize(): void {
    // Determine topological sort based on 'before' and 'after'
    // For now, assume they are registered in the correct order or use priority fallback
    this.plugins.sort((a, b) => {
      const pA = a.metadata.priority || 0;
      const pB = b.metadata.priority || 0;
      return pB - pA; // Higher priority first
    });

    for (const plugin of this.plugins) {
      plugin.initialize?.(this.registry);
    }
    for (const plugin of this.plugins) {
      plugin.onRegister?.();
    }
  }

  public beforeUpdate(context: FrameContext): void {
    for (const plugin of this.plugins) {
      plugin.beforeUpdate?.(context);
    }
  }

  public fixedUpdate(context: FrameContext): void {
    for (const plugin of this.plugins) {
      plugin.fixedUpdate?.(context);
    }
  }

  public update(context: FrameContext): void {
    for (const plugin of this.plugins) {
      plugin.update?.(context);
    }
  }

  public lateUpdate(context: FrameContext): void {
    for (const plugin of this.plugins) {
      plugin.lateUpdate?.(context);
    }
  }

  public buildSnapshots(context: FrameContext): any[] {
    for (const plugin of this.plugins) {
      plugin.beforeSnapshot?.(context);
    }

    const outputs: any[] = [];
    for (const plugin of this.plugins) {
      const output = plugin.afterSnapshot?.(context);
      if (output) {
        outputs.push({
          pluginId: plugin.metadata.id,
          data: output.snapshot
        });
      }
    }
    return outputs;
  }

  public shutdown(): void {
    for (const plugin of this.plugins) {
      plugin.shutdown?.();
    }
  }
}
