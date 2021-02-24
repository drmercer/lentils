export type Guard<T> = (x: unknown) => x is T;

export function isBoolean(x: unknown): x is boolean {
  return typeof x === 'boolean';
}

export function isString(x: unknown): x is string {
  return typeof x === 'string';
}

export function isNumber(x: unknown): x is number {
  return typeof x === 'number';
}

export function isObject(x: unknown): x is Record<string, unknown> & object {
  return !!x && typeof x === 'object';
}

export function isArray(x: unknown): x is unknown[] {
  return Array.isArray(x);
}

export function isArrayOf<T>(isT: Guard<T>): (x: unknown) => x is T[] {
  return (x): x is T[] => {
    return isArray(x) && x.every(isT);
  }
}

export function isFunction(x: unknown): x is Function {
  return typeof x === 'function';
}

export function isUndefined(x: unknown): x is undefined {
  return x === void 0;
}

export function isNonNull<T>(x: T): x is NonNullable<T> {
  return x != null;
}

export function assertNever(value: never): never {
  console.error('Unexpected value!', value);
  throw new Error('Unexpected value!');
}
