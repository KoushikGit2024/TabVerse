import { EngineCommand } from '../api/Command';

export class ActionDispatcher {
  private commandQueue: EngineCommand[] = [];

  public ingest(commands: EngineCommand[]) {
    this.commandQueue.push(...commands);
  }

  public flush(): EngineCommand[] {
    const commands = [...this.commandQueue];
    this.commandQueue = [];
    return commands;
  }
}
