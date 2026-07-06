export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  // LCG (Linear Congruential Generator)
  public next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 4294967296;
  }
}
