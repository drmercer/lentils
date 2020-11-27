import { firstDifferentIndex } from "../array/array";

/**
 * @module
 * Utilities for handling **Unix-style** paths.
 */

/**
 * "/", the path segment separator used throughout this file
 */
export const separator = '/';

export function pathSegments(path: string): string[] {
  return path.split(separator);
}

export function relativePathFromTo(from: string, to: string): string {
  const fromSegments = pathSegments(from);
  const toSegments = pathSegments(to);
  const divergeAt = firstDifferentIndex(fromSegments, toSegments) ?? fromSegments.length - 1;
  const upwardsStepCount = fromSegments.length - divergeAt - 1;
  const upwardsSegments = upwardsStepCount > 0 ? Array(upwardsStepCount).fill('..') : ['.'];
  return upwardsSegments
    .concat(toSegments.slice(divergeAt))
    .join(separator);
}

/**
 * Resolves a given path relative to a given context, if the path is relative.
 *
 * @param context The context path
 * @param maybeRelative The path to resolve relative to `context`
 * @returns The resolved path, or undefined if the context path is too shallow for the relative path
 */
export function resolveRelative(context: string, maybeRelative: string): string | undefined {
  const relativeSegments = pathSegments(maybeRelative)
    .filter(v => v !== '.');

  if (maybeRelative.startsWith(separator)) {
    // not relative
    return relativeSegments.join(separator);
  }

  const contextSegments = pathSegments(context);

  let upwardsStepCount = 0;
  let stepCount = 0;
  for (const segment of relativeSegments) {
    if (segment === '..') {
      upwardsStepCount++;
      stepCount++;
    } else if (segment === '.') {
      stepCount++;
    } else {
      break;
    }
  }

  const contextSegmentsToKeepCount = contextSegments.length - 1 - upwardsStepCount;
  if (contextSegmentsToKeepCount < 0) {
    return undefined;
  }

  return contextSegments
    .slice(0, contextSegmentsToKeepCount)
    .concat(relativeSegments.slice(stepCount))
    .join(separator);
}
