// Force IDE reload
import { EngineCommand } from './Command.ts';
import { ServiceRegistry } from './ServiceRegistry.ts';
import { Capabilities } from './Capabilities.ts';

export interface FrameContext {
  readonly frame: number;
  readonly dt: number;
  readonly commands: readonly EngineCommand[];
  readonly world: any; // We'll type this properly later
}

export interface PluginMetadata {
  readonly id: string;
  readonly version: string;
  readonly capabilities: Capabilities;
  readonly before?: readonly string[];
  readonly after?: readonly string[];
  readonly priority?: number; // fallback ordering
}

export interface PluginOutput {
  readonly snapshot?: any; // The state this plugin wants to contribute to the snapshot
}

export interface IPlugin {
  readonly metadata: PluginMetadata;

  initialize?(registry: ServiceRegistry): void;
  onRegister?(): void;
  beforeUpdate?(context: FrameContext): void;
  fixedUpdate?(context: FrameContext): void;
  update?(context: FrameContext): void;
  lateUpdate?(context: FrameContext): void;
  
  beforeSnapshot?(context: FrameContext): void;
  afterSnapshot?(context: FrameContext): PluginOutput | void;
  
  shutdown?(): void;
}
