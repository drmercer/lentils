import { CompareFn } from './comparators';

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
): void {
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
    const middleComparison = compareFn(newItem, middleItem);
    // console.log({
    //   min,
    //   max,
    //   middle,
    //   middleItem,
    //   middleComparison,
    // });
    if (middleComparison === 0) {
      if (isDuplicate(newItem, middleItem)) {
        // Don't insert newItem because it's a duplicate
        return;
      }
      // TODO check for duplicates in surrounding area, in case multiple items compare the same but only one is a duplicate
      max = middle;
      min = middle;
    } else if (middleComparison < 0) {
      // newItem comes before middleItem
      max = middle;
    } else {
      // newItem comes after middleItem
      min = middle + 1;
    }
  }
  if (failsafe >= maxIters) {
    throw new Error("Failsafe triggered!");
  }
  sortedArray.splice(max, 0, newItem);
}
