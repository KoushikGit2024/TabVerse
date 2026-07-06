export interface EngineCommand {
  readonly type: string;
  readonly payload?: any;
}

export interface IInputMapper {
  poll(): EngineCommand[];
}
