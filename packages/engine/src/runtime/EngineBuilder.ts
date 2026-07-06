import { IPlugin } from '../api/Plugin';
import { IInputMapper } from '../api/Command';
import { EngineConfig } from '../api/Configuration.ts';
import { Engine } from './Engine.ts';
import { DefaultServiceRegistry } from './DefaultServiceRegistry.ts';

export class EngineBuilder {
  private config?: EngineConfig;
  private clock: any;
  private network: any;
  private viewport: any;
  private inputMappers: IInputMapper[] = [];
  private plugins: IPlugin[] = [];

  public withConfiguration(config: EngineConfig): EngineBuilder {
    this.config = config;
    return this;
  }

  public withClock(clock: any): EngineBuilder {
    this.clock = clock;
    return this;
  }

  public withNetwork(network: any): EngineBuilder {
    this.network = network;
    return this;
  }

  public withViewport(viewport: any): EngineBuilder {
    this.viewport = viewport;
    return this;
  }

  public withInputMapper(mapper: IInputMapper): EngineBuilder {
    this.inputMappers.push(mapper);
    return this;
  }

  public use(plugin: IPlugin): EngineBuilder {
    this.plugins.push(plugin);
    return this;
  }

  public build(): Engine {
    if (!this.config) throw new Error("Engine configuration is required.");

    const registry = new DefaultServiceRegistry();
    registry.register('Config', this.config);
    if (this.clock) registry.register('Clock', this.clock);
    if (this.network) registry.register('Network', this.network);
    if (this.viewport) registry.register('Viewport', this.viewport);

    return new Engine(registry, this.inputMappers, this.plugins);
  }
}
