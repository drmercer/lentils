import { isObject, isBoolean } from '../types/checks';

export interface MemoizeOptions<A extends unknown[], T> {
  /** defaults to JSON.stringify(args) */
  keyFn?: (...args: A) => string;
  /** defaults to 1 */
  cacheSize?: number;
  /** defaults to () => true */
  keepFn?: (t: T) => boolean;
}

const defaultKeyFn = ((...x: unknown[]) => JSON.stringify(x));
const defaultCacheSize = 1;

/**
 * Memoizes the given function, `f`.
 */
export function memoize<A extends unknown[], T>(
  options: MemoizeOptions<A, T>,
  f: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  const {
    keyFn = defaultKeyFn,
    cacheSize = defaultCacheSize,
    keepFn = () => true,
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
        // Specific to Journote, for now:
        if (isObject(result) && isBoolean(result.success) && !options.keepFn) {
          console.error("keepFn not specified, but you're returning what looks like a Result");
        }
        if (keepFn(result)) {
          cache.set(key, Promise.resolve(result));
        } else {
          cache.delete(key);
        }
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
