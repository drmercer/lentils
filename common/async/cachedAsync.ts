export function cachedAsync<T>(f: () => Promise<T>): (force?: boolean) => Promise<T> {
  let promise: Promise<T> | undefined = undefined;
  return (force?: boolean) => {
    if (!promise || force) {
      promise = f().catch((err) => {
        // clear cache if an error occurs, so the async thing can be redone
        promise = undefined;
        throw err;
      });
    }
    return promise;
  };
}

interface MemoizeOptions<A extends unknown[], T> {
  /** defaults to JSON.stringify(args) */
  keyFn?: (...args: A) => string;
  /** defaults to 5 */
  maxCount?: number
}

const defaultKeyFn = ((...x: unknown[]) => JSON.stringify(x));
const defaultMaxCount = 5;

export function memoize<A extends unknown[], T>(
  options: MemoizeOptions<A, T>,
  f: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  const {
    keyFn = defaultKeyFn,
    maxCount = defaultMaxCount,
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

      // Prune cache to a size of maxCount
      if (cacheKeys.length > maxCount) {
        const deleted = cacheKeys.splice(0, cacheKeys.length - maxCount);
        for (const keyToDelete of deleted) {
          cache.delete(keyToDelete);
        }
      }
    }

    return promise;
  };
}
