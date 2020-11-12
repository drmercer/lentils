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
