export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(x, max));
}

function isBetween(x: number, a: number, b: number) {
  return (x >= a && x < b);
}

export function rangeOverlap(a: number, b: number, x: number, y: number): [number, number]|undefined {
  if (isBetween(a, x, y)) {
    if (isBetween(b, x, y)) {
      return [a, b];
    } else {
      return [a, y];
    }
  } else if (isBetween(b, x, y)) {
    return [x, b];
  } else if (isBetween(x, a, b)) {
    return [x, y];
  } else {
    return undefined;
  }
}
