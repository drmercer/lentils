import { compareNumbers } from './comparators';
import { binarySearch, sortedInsertNoDuplicates } from './sort';

const randomSortedArray = (length: number) => Array(length).fill(0).map(() => Math.random()).sort(compareNumbers);

describe('binarySearch', () => {

  it('should work on an empty array', () => {
    const array: number[] = [];
    const result = binarySearch(array, compareNumbers, 1337);
    expect(result).toEqual({
      index: 0,
      found: false,
    });
  });

  it('should work on a basic non-empty array when the needle is NOT in the array', () => {
    const array = [1337, 1338, 1340];
    const result = binarySearch(array, compareNumbers, 1339);
    expect(result).toEqual({
      index: 2,
      found: false,
    });
  });

  it('should work on a basic non-empty array when the needle IS in the array', () => {
    const array = [1337, 1338, 1339];
    const result = binarySearch(array, compareNumbers, 1339);
    expect(result).toEqual({
      index: 2,
      found: true,
    });
  });

  it('should work on a large array when the needle is NOT in the array', () => {
    const array: number[] = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
    const result = binarySearch(array, compareNumbers, 9.5);
    expect(result).toEqual({
      index: 9,
      found: false,
    });
  });

  it('should work on a large array when the needle IS in the array', () => {
    const array: number[] = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
    const result = binarySearch(array, compareNumbers, 1);
    expect(result).toEqual({
      index: 0,
      found: true,
    });
  });

  function testRandomArrayWithLength(initialLength: number) {
    const array: number[] = randomSortedArray(initialLength);
    const index = Math.floor(Math.random() * array.length);
    const needle = array[index];

    const result = binarySearch(array, compareNumbers, needle);
    expect(result).toEqual({
      index,
      found: true,
    });
  }

  it('should work on a very large random array', () => {
    testRandomArrayWithLength(1000);
  });

  it('should work on random arrays of random lengths', () => {
    Array(100).fill(0).forEach(() => {
      testRandomArrayWithLength(Math.round(1000 * Math.random()));
    });
  });
})

describe('sortedInsertNoDuplicates', () => {

  const allowDuplicates = () => false;
  const preventDuplicates = (a: number, b: number) => a === b;

  it('should work on an empty array', () => {
    const array: number[] = [];
    const result = sortedInsertNoDuplicates(array, compareNumbers, allowDuplicates, 1337);
    expect(result).toEqual({
      alreadyExisted: false,
      index: 0,
    });
    expect(array).toEqual([1337]);
  });

  it('should work repeatedly on an initially-empty array with the same newItem', () => {
    const array: number[] = [];
    sortedInsertNoDuplicates(array, compareNumbers, allowDuplicates, 1337);
    sortedInsertNoDuplicates(array, compareNumbers, allowDuplicates, 1337);
    sortedInsertNoDuplicates(array, compareNumbers, allowDuplicates, 1337);
    expect(array).toEqual([1337, 1337, 1337]);
  });

  it('should work repeatedly on an initially-empty array with the same newItem, with preventing duplicates', () => {
    const array: number[] = [];
    const result1 = sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 1337);
    expect(result1).toEqual({
      alreadyExisted: false,
      index: 0,
    });
    const result2 = sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 1337);
    expect(result2).toEqual({
      alreadyExisted: true,
      index: 0,
    });
    sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 1337);
    expect(array).toEqual([1337]);
  });

  it('should work repeatedly on an initially-empty array with different newItems', () => {
    const array: number[] = [];
    sortedInsertNoDuplicates(array, compareNumbers, allowDuplicates, 1338);
    expect(array).toEqual([1338]);
    sortedInsertNoDuplicates(array, compareNumbers, allowDuplicates, 1337);
    expect(array).toEqual([1337, 1338]);
    sortedInsertNoDuplicates(array, compareNumbers, allowDuplicates, 1340);
    expect(array).toEqual([1337, 1338, 1340]);
    sortedInsertNoDuplicates(array, compareNumbers, allowDuplicates, 1339);
    expect(array).toEqual([1337, 1338, 1339, 1340]);
  });

  it('should work on a large array', () => {
    const array: number[] = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
    sortedInsertNoDuplicates(array, compareNumbers, allowDuplicates, 9.5);
    expect(array).toEqual([1,2,3,4,5,6,7,8,9,9.5,10,11,12,13,14,15,16]);
  });

  it('should work on a large array, preventing duplicates', () => {
    const originalArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const array: number[] = originalArray.slice();
    sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 1);
    sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 2);
    sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 3);
    sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 8);
    sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 9);
    sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 10);
    sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 15);
    sortedInsertNoDuplicates(array, compareNumbers, preventDuplicates, 16);
    expect(array).toEqual(originalArray);
  });

  function testRandomArrayWithLength(initialLength: number) {
    const array: number[] = Array(initialLength).fill(0).map(() => Math.random()).sort(compareNumbers);

    sortedInsertNoDuplicates(array, compareNumbers, allowDuplicates, Math.random());

    expect(array.length).toEqual(initialLength + 1);
    expect(array.slice().sort(compareNumbers)).toEqual(array);
  }

  it('should work on a very large random array', () => {
    testRandomArrayWithLength(1000);
  });

  it('should work on random arrays of random lengths', () => {
    Array(100).fill(0).forEach(() => {
      testRandomArrayWithLength(Math.round(1000 * Math.random()));
    });
  });
})
