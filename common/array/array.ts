export function firstDifferentIndex(a: unknown[], b: unknown[]): number | undefined {
  const shorterLength = Math.min(a.length, b.length);
  let i = 0;
  while (a[i] === b[i]) {
    i++;
    if (i >= shorterLength) {
      return a.length === b.length ? undefined : i;
    }
  }
  return i;
}

export function unique<T>(a: T[]): T[] {
  const seen = new Set<T>();
  return a.filter(el => {
    if (!seen.has(el)) {
      seen.add(el);
      return true;
    } else {
      return false;
    }
  });
}
