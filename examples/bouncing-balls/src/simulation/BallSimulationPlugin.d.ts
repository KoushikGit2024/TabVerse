import { IPlugin, FrameContext, PluginOutput } from '@tabverse/engine/api';
import { ServiceRegistry } from '@tabverse/engine/api';
export declare class BallSimulationPlugin implements IPlugin {
    metadata: {
        id: string;
        version: string;
        capabilities: {
            requiresPhysics: boolean;
        };
    };
    private entities;
    private rng;
    private transport?;
    initialize(registry: ServiceRegistry): void;
    private spawnBall;
    update(context: FrameContext): void;
    afterSnapshot(): PluginOutput;
}
