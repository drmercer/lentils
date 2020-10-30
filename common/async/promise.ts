/**
 * Returns a version of f that waits for any previous call to finish
 * (reject or resolve) before beginning the next call
 *
 * @param f The function to return a synchronized variant of
 */
export function synchronized<A extends unknown[], R>(f: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  let lastCall: Promise<any> = Promise.resolve();
  const reset = () => {
    lastCall = Promise.resolve();
  };
  return (...args: A) => {
    const promise: Promise<R> = lastCall.then(() => f(...args));
    lastCall = promise.then(reset, reset);
    return promise;
  };
}
