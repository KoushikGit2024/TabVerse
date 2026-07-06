import { ServiceRegistry } from '../api/ServiceRegistry';

export class DefaultServiceRegistry implements ServiceRegistry {
  private services: Map<string, any> = new Map();

  public register<T>(name: string, service: T): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }
    this.services.set(name, service);
  }

  public get<T>(name: string): T | undefined {
    return this.services.get(name);
  }

  public remove(name: string): void {
    this.services.delete(name);
  }
}
