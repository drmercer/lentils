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
  // Set iterates in insertion order, so this is sufficient.
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
  return Array.from(new Set(a));
}

export function deleteElement<T>(a: T[], el: T): void {
  const index = a.indexOf(el);
  if (index !== -1) {
    a.splice(index, 1);
  }
}
