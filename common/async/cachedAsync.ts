export class CachedAsync<T> {
  private cachedPromise?: Promise<T>;

  constructor(private f: () => Promise<T>) { }

  public async get(noCache = false): Promise<T> {
    if (!this.cachedPromise || noCache) {
      this.cachedPromise = this.f().catch((err) => {
        // clear cache if an error occurs, so the async thing can be redone
        this.cachedPromise = undefined;
        throw err;
      });
    }
    return this.cachedPromise;
  }
}

export function cachedAsync<T>(f: () => Promise<T>): CachedAsync<T> {
  return new CachedAsync(f);
}
