export class BrowserClock {
  public now(): number {
    return performance.now();
  }
}
