import { compareByKey, compareNumbers, invert } from './comparators';

describe('compareByKey', () => {
  it('should sort by a single key correctly', () => {
    const arr = [
      { a: 3 },
      { a: 2 },
      { a: 1 },
      { a: 4 },
    ];
    expect(arr.sort(compareByKey('a'))).toEqual([
      { a: 1 },
      { a: 2 },
      { a: 3 },
      { a: 4 },
    ]);
  });
  it('should sort by multiple keys correctly', () => {
    const arr = [
      { a: 3, b: 1 },
      { a: 2, b: 1 },
      { a: 4, b: 3 },
      { a: 2, b: 2 },
      { a: 3, b: 2 },
      { a: 1, b: 1 },
      { a: 4, b: 1 },
    ];
    expect(arr.sort(compareByKey('a', 'b'))).toEqual([
      { a: 1, b: 1 },
      { a: 2, b: 1 },
      { a: 2, b: 2 },
      { a: 3, b: 1 },
      { a: 3, b: 2 },
      { a: 4, b: 1 },
      { a: 4, b: 3 },
    ]);
  });
});

describe('compareNumbers', () => {
  it('should sort numbers correctly', () => {
    const arr = [
      3,
      2,
      1,
      4,
    ];
    expect(arr.sort(compareNumbers)).toEqual([
      1,
      2,
      3,
      4,
    ]);
  });
});

describe('invert', () => {
  it('should sort numbers invertedly correctly', () => {
    const arr = [
      3,
      2,
      1,
      4,
    ];
    expect(arr.sort(invert(compareNumbers))).toEqual([
      4,
      3,
      2,
      1,
    ]);
  });
});
