import { clamp } from './math';

describe('clamp', () => {

  it('should work', () => {
    expect(clamp(2, 1, 3)).toBe(2);
    expect(clamp(10, 1, 3)).toBe(3);
    expect(clamp(0, 1, 3)).toBe(1);
  });

});
