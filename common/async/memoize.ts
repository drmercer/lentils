interface MemoizeOptions<A extends unknown[], T> {
  /** defaults to JSON.stringify(args) */
  keyFn?: (...args: A) => string;
  /** defaults to 5 */
  cacheSize?: number
}

const defaultKeyFn = ((...x: unknown[]) => JSON.stringify(x));
const defaultCacheSize = 1;

export function memoize<A extends unknown[], T>(
  options: MemoizeOptions<A, T>,
  f: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  const {
    keyFn = defaultKeyFn,
    cacheSize = defaultCacheSize,
  } = options;

  let cache = new Map<string, Promise<T>>();
  let cacheKeys: string[] = [];

  return (...params: A) => {
    const key = keyFn(...params);
    let promise = cache.get(key);

    if (!promise) {
      promise = Promise.resolve().then(() => {
        // this is wrapped in a .then() call just in case f throws an error
        return f(...params);
      }).then(result => {
        cache.set(key, Promise.resolve(result));
        return result;
      }, err => {
        cache.delete(key);
        throw err;
      });

      cacheKeys.push(key);
      cache.set(key, promise);

      // Prune cache to a size of cacheSize
      if (cacheKeys.length > cacheSize) {
        const deleted = cacheKeys.splice(0, cacheKeys.length - cacheSize);
        for (const keyToDelete of deleted) {
          cache.delete(keyToDelete);
        }
      }
    }

    return promise;
  };
}
