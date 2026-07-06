export interface ServiceRegistry {
  register<T>(name: string, service: T): void;
  get<T>(name: string): T | undefined;
  remove(name: string): void;
}
