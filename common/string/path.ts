import { firstDifferentIndex } from "../array/array";

/*
 * Utilities for handling **Unix-style** paths.
 */

export function pathSegments(path: string): string[] {
  return path.split('/');
}

export function relativePathFromTo(from: string, to: string): string {
  const fromSegments = pathSegments(from);
  const toSegments = pathSegments(to);
  const divergeAt = firstDifferentIndex(fromSegments, toSegments) ?? fromSegments.length - 1;
  const upwardsStepCount = fromSegments.length - divergeAt - 1;
  const upwardsSegments = upwardsStepCount > 0 ? Array(upwardsStepCount).fill('..') : ['.'];
  return upwardsSegments
    .concat(toSegments.slice(divergeAt))
    .join('/');
}
