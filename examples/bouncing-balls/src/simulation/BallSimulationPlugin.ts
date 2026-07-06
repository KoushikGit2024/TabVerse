import { IPlugin, FrameContext, PluginOutput, Entity } from '@tabverse/engine/api';
import { RNG } from '@tabverse/engine/core';
import { INetworkTransport, ServiceRegistry } from '@tabverse/engine/api';

export class BallSimulationPlugin implements IPlugin {
  public metadata = {
    id: 'SimulationPlugin',
    version: '1.0.0',
    capabilities: { requiresPhysics: true }
  };

  private entities: Entity[] = [];
  private rng: RNG = new RNG(12345);
  private transport?: INetworkTransport;

  public initialize(registry: ServiceRegistry) {
    this.transport = registry.get<INetworkTransport>('Network') as INetworkTransport;
    
    if (this.transport) {
      this.transport.onMessage((msg: any) => {
        if (msg.type === 'STATE' && msg.payload.balls) {
          // Rehydrate entities from state
        }
      });
    }

    // Spawn initial ball
    this.spawnBall(500, 500);
  }

  private spawnBall(x: number, y: number) {
    const id = Math.floor(this.rng.next() * 1000000).toString(36);
    
    const components = new Map<string, any>();
    components.set('Transform', { type: 'Transform', x, y, rotation: 0 });
    components.set('Physics', { type: 'Physics', vx: (this.rng.next() > 0.5 ? 1 : -1) * 300, vy: (this.rng.next() > 0.5 ? 1 : -1) * 300, mass: 1 });
    components.set('Collider', { type: 'Collider', shape: 'circle', radius: 30 });
    
    this.entities.push({ id, components } as any);
  }

  public update(context: FrameContext) {
    for (const cmd of context.commands) {
      if (cmd.type === 'SpawnEntity') {
        this.spawnBall(Math.random() * 800, Math.random() * 800); // Or use Viewport offset
      }
    }

    // In a real implementation we'd pass the actual world geometry from the FrameContext
    for (const entity of this.entities) {
      const transform = entity.components.get('Transform') as any;
      const physics = entity.components.get('Physics') as any;

      if (transform && physics) {
        transform.x += (physics.vx * context.dt) / 1000;
        transform.y += (physics.vy * context.dt) / 1000;

        // Bounce off arbitrary bounds for now just as a test
        if (transform.x < 0 || transform.x > 2000) physics.vx *= -1;
        if (transform.y < 0 || transform.y > 1000) physics.vy *= -1;
      }
    }

    if (this.transport) {
      // Send state over network
    }
  }

  public afterSnapshot(): PluginOutput {
    return {
      snapshot: this.entities
    };
  }
}
