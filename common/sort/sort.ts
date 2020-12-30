import { CompareFn } from './comparators';

const strictEquality = (a: unknown, b: unknown) => a === b;

/**
 * Returns the index of the given item ("needle") in the sortedArray, or the earliest index where
 * that needle would be if it were in the array. Also returns whether the needle was actually found
 *
 * @param sortedArray
 * @param compareFn
 * @param needle
 * @param equals
 */
export function binarySearch<T>(
  sortedArray: T[],
  compareFn: CompareFn<T>,
  needle: T,
  equals: (a: T, b: T) => boolean = strictEquality,
): {index: number, found: boolean} {
  let min = 0;
  let max = sortedArray.length;
  let failsafe = 0;
  const maxIters = sortedArray.length + 10;
  // console.log({
  //   sortedArray,
  //   newItem,
  // })
  while (max > min && failsafe++ < maxIters) {
    const middle = Math.floor((min + max) / 2);
    const middleItem = sortedArray[middle];
    const middleComparison = compareFn(needle, middleItem);
    // console.log({
    //   min,
    //   max,
    //   middle,
    //   middleItem,
    //   middleComparison,
    // });
    if (middleComparison === 0) {
      // needle sorts the same as middleItem, so look for needle in the neighbors
      if (equals(needle, middleItem)) {
        return {
          index: middle,
          found: true,
        };
      }
      for (
        let forward = middle + 1;
        forward < sortedArray.length && compareFn(needle, sortedArray[forward]) === 0;
        forward++
      ) {
        if (equals(needle, sortedArray[forward])) {
          return {
            index: forward,
            found: true,
          };
        }
      }
      let backward = middle - 1;
      for (
        ;
        backward >= 0 && compareFn(needle, sortedArray[backward]) === 0;
        backward--
      ) {
        if (equals(needle, sortedArray[backward])) {
          return {
            index: backward,
            found: true,
          };
        }
      }
      return {
        index: backward + 1,
        found: false,
      };
    } else if (middleComparison < 0) {
      // newItem comes before middleItem
      max = middle;
    } else {
      // newItem comes after middleItem
      min = middle + 1;
    }
  }
  if (failsafe >= maxIters) {
    throw new Error("binarySearch failsafe triggered!");
  }
  return {
    index: max,
    found: equals(needle, sortedArray[max]),
  };
}

/**
 * Mutates the given sorted array by inserting the given item in its proper place in the array, using
 * the given equality check to avoid duplicates.
 *
 * @param sortedArray
 * @param newItem
 */
export function sortedInsertNoDuplicates<T>(
  sortedArray: T[],
  compareFn: CompareFn<T>,
  isDuplicate: (a: T, b: T) => boolean,
  newItem: T,
) {
  const {index, found} = binarySearch(sortedArray, compareFn, newItem, isDuplicate);
  if (!found) {
    sortedArray.splice(index, 0, newItem);
  }
  return {
    alreadyExisted: found,
    index,
  };
}
