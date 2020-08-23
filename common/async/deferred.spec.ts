import { deferred } from './deferred';

describe('deferred', () => {
  it('should resolve correctly', async () => {
    const def = deferred<string>();
    def.resolve('gluten-free bagel');
    expect(await def.promise).toBe('gluten-free bagel');
  });
  it('should reject correctly', async () => {
    const def = deferred<string>();
    def.reject('gluten bagel');
    await expect(def.promise).rejects.toBe('gluten bagel');
  });
});
