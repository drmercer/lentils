import { Deferred, deferred } from './deferred';
import { synchronized } from './promise';
import { delay } from './delay';

describe('synchronized', () => {
  it('should wait for the first call to finish before proceeding with the second', async () => {
    const calls: Deferred<string>[] = [];
    const testFn = synchronized(() => {
      const def = deferred<string>();
      calls.push(def);
      return def.promise;
    });

    const p1 = testFn();
    await delay(0);

    expect(calls.length).toBe(1);

    const p2 = testFn();
    await delay(0);

    expect(calls.length).toBe(1); // should still be 1

    calls[0].resolve('foo');
    expect(await p1).toBe('foo');
    await delay(0);

    expect(calls.length).toBe(2);

    calls[1].resolve('bar');
    expect(await p2).toBe('bar');
  });
})
