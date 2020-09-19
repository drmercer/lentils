export function cachedAsync<T>(f: () => Promise<T>): (force?: boolean) => Promise<T> {
  let promise: Promise<T> | undefined = undefined;
  return async (force?: boolean) => {
    if (!promise || force) {
      promise = f().catch((err) => {
        // clear cache if an error occurs, so the async thing can be redone
        promise = undefined;
        throw err;
      });
    }
    return await promise;
  };
}
