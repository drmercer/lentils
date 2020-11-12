import { firstDifferentIndex } from './array';

describe("firstDifferentIndex", () => {
  it('should find the first differing index', () => {
    const a = [1, 2, 3, 4];
    const b = [1, 2, 0, 4];
    const i = firstDifferentIndex(a, b);
    expect(i).toBe(2);
  });

  it('should return undefined when given identical arrays', () => {
    const a = [1, 2, 3, 4];
    const b = [1, 2, 3, 4];
    const i = firstDifferentIndex(a, b);
    expect(i).toBe(undefined);
  });

  it('should return undefined when given identical empty arrays', () => {
    const i = firstDifferentIndex([], []);
    expect(i).toBe(undefined);
  });

  it('should return the length of the shorter array when one is a prefix of the other', () => {
    const a = [1, 2, 3, 4];
    const b = [1, 2, 3, 4, 5, 6, 7];
    const i = firstDifferentIndex(a, b);
    expect(i).toBe(4);

    const j = firstDifferentIndex(b, a);
    expect(j).toBe(4);
  });
});
