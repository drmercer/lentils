import { deleteElement, firstDifferentIndex, unique } from './array';

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

describe("unique", () => {
  it('should return an identical array if no elements are repeated', () => {
    const input = [1, 2, 3, 4];
    const output = unique(input);
    expect(output).toEqual(input);
  });

  it('should filter out repeated elements', () => {
    const input = [1, 1, 2, 3, 2, 4, 1];
    const output = unique(input);
    expect(output).toEqual([1, 2, 3, 4]);
  });

  it('should work on empty arrays', () => {
    expect(unique([])).toEqual([]);
  });

  it('should work on arrays of non-primitives', () => {
    const a = { n: 1 };
    const b = { n: 1 }; // note - the same structure, but different instances, so b should still be in the result
    const input = [a, a, a, b, b, a, b];
    const output = unique(input);
    expect(output).toEqual([a, b]);
  });
});

describe("deleteElement", () => {
  it('should mutate the given array by deleting the given element', () => {
    const input = [1, 2, 3, 4];
    deleteElement(input, 3);
    expect(input).toEqual([1, 2, 4]);
  });

  it('should do nothing if the given array does not contain the given element', () => {
    const input = [1, 2, 3, 4];
    deleteElement(input, 7);
    expect(input).toEqual([1, 2, 3, 4]);
  });

});
