/**
 * Returns a promise that resolves after the given number of milliseconds
 * @param ms
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(() => { resolve() }, ms));
}
