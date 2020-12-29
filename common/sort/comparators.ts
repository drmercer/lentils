/**
 * A comparison function, as expected by Array.prototype.sort()
 */
export type CompareFn<T> = (a: T, b: T) => number;

/**
 * Sorts by the keys given, in the order given.
 *
 * @todo replace this with a generic function that combines CompareFns.
 *
 * @param keys The keys to sort by, in order of precedence.
 */
export function compareByKey<T>(...keys: (keyof T)[]): CompareFn<T> {
  return (a: T, b: T): number => {
    for (const key of keys) {
      if (a[key] > b[key]) {
        return 1;
      } else if (a[key] < b[key]) {
        return -1;
      }
    }
    return 0;
  }
}

export const compareNumbers: CompareFn<number> = (a: number, b: number) => a - b;

export function invert<T>(comparator: CompareFn<T>): CompareFn<T> {
  return (a, b) => comparator(a, b) * -1;
}
