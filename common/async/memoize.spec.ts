import { memoize } from './memoize';

describe('memoize', () => {
  it('should cache results correctly', async () => {
    type Fn = (a: string, b: number) => Promise<string>;
    const mockFn = jest.fn(async (a: string, b: number) => a + b);
    const memoizedFn: Fn = memoize({}, mockFn);

    expect(await memoizedFn('potato', 2)).toBe('potato2');
    expect(await memoizedFn('potato', 2)).toBe('potato2');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cache results correctly with a custom key function', async () => {
    type Fn = (a: string, b: number) => Promise<string>;
    const mockFn = jest.fn(async (a: string, b: number) => a + b);
    const memoizedFn: Fn = memoize({
      keyFn: (a, _b) => a,
    }, mockFn);

    expect(await memoizedFn('potato', 2)).toBe('potato2');
    // This assertion seems wrong, but it's because the keyFn only uses the first value
    expect(await memoizedFn('potato', 1234567)).toBe('potato2');
    expect(mockFn).toHaveBeenCalledTimes(1);

    expect(await memoizedFn('bagel', 2)).toBe('bagel2');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should impose a default max cache size of 5', async () => {
    type Fn = (a: string, b: number) => Promise<string>;
    const mockFn = jest.fn(async (a: string, b: number) => a + b);
    const memoizedFn: Fn = memoize({}, mockFn);

    const defaultMaxCacheSize = 5;
    for (let i = 0; i < defaultMaxCacheSize; i++) {
      expect(await memoizedFn('foo', i)).toBe('foo' + i);
    }

    expect(mockFn).toHaveBeenCalledTimes(defaultMaxCacheSize);

    // make all the calls again
    for (let i = 0; i < defaultMaxCacheSize; i++) {
      expect(await memoizedFn('foo', i)).toBe('foo' + i);
    }
    // make the 1st call again
    expect(await memoizedFn('foo', 0)).toBe('foo' + 0);

    expect(mockFn).toHaveBeenCalledTimes(defaultMaxCacheSize);

    // make a 6th unique call, pushing the first one off the cache
    expect(await memoizedFn('bagel', 1)).toBe('bagel1');

    expect(mockFn).toHaveBeenCalledTimes(defaultMaxCacheSize + 1);

    // make the 1st call again - should not hit the cache
    expect(await memoizedFn('foo', 0)).toBe('foo' + 0);

    expect(mockFn).toHaveBeenCalledTimes(defaultMaxCacheSize + 2);
  });

  it('should accept a maxCount option to customize the max cache size', async () => {
    type Fn = (a: string, b: number) => Promise<string>;
    const mockFn = jest.fn(async (a: string, b: number) => a + b);

    const maxCacheSize = 5;

    const memoizedFn: Fn = memoize({
      maxCount: maxCacheSize,
    }, mockFn);

    for (let i = 0; i < maxCacheSize; i++) {
      expect(await memoizedFn('foo', i)).toBe('foo' + i);
    }

    expect(mockFn).toHaveBeenCalledTimes(maxCacheSize);

    // make all the calls again
    for (let i = 0; i < maxCacheSize; i++) {
      expect(await memoizedFn('foo', i)).toBe('foo' + i);
    }
    // make the 1st call again
    expect(await memoizedFn('foo', 0)).toBe('foo' + 0);

    expect(mockFn).toHaveBeenCalledTimes(maxCacheSize);

    // make a 6th unique call, pushing the first one off the cache
    expect(await memoizedFn('bagel', 1)).toBe('bagel1');

    expect(mockFn).toHaveBeenCalledTimes(maxCacheSize + 1);

    // make the 1st call again
    expect(await memoizedFn('foo', 0)).toBe('foo' + 0);

    expect(mockFn).toHaveBeenCalledTimes(maxCacheSize + 2);
  });
});
