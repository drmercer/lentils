/**
 * A comparison function, as expected by Array.prototype.sort()
 */
export type CompareFn<T> = (a: T, b: T) => number;

/**
 * Sorts by the keys given, in the order given.
 *
 * @deprecated This assumes that the properties specified can be compared with < and >. Use
 * {@link map}, {@link multi}, etc. for better type safety.
 *
 * @param keys The keys to sort by, in order of precedence.
 */
export function compareByKey<T>(...keys: (keyof T)[]): CompareFn<T> {
  const comparators = keys.map(k => {
    return map(
      (x: T) => x[k] as unknown as string,
      compareStrings,
    );
  });
  return multi(...comparators)
}

/**
 * Composes a list of comparators, in order. Sorts by the first comparator, then the second, and so on
 *
 * Note: I recommend just composing comparators using `||` instead, like so:
 *
 * ```
 * arr.sort((a, b) => compare1(a, b) || compare2(a, b))
 * ```
 */
export function multi<T>(...comparators: CompareFn<T>[]): CompareFn<T> {
  return comparators.reduceRight((r, c) => {
    return (a, b) => c(a, b) || r(a, b);
  });
}

export const compareNumbers: CompareFn<number> = (a: number, b: number) => a - b;

export const compareStrings: CompareFn<string> = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function invert<T>(comparator: CompareFn<T>): CompareFn<T> {
  return (a, b) => comparator(a, b) * -1;
}

export function map<T, U>(f: (t: T) => U, c: CompareFn<U>): CompareFn<T> {
  return (a, b) => c(f(a), f(b));
}

export function lazyMap<T, U>(mapFn: (t: T) => U, uCompareFn: CompareFn<U>): CompareFn<T> {
  const cache = new Map<T, U>();
  function getU(t: T): U {
    if (!cache.has(t)) {
      cache.set(t, mapFn(t));
    }
    return cache.get(t)!;
  }
  return (a, b) => uCompareFn(getU(a), getU(b));
}
