export interface AbstractConstructor<T> extends Function {
  prototype: T;
}

export interface Constructor<T> {
  new (...args: any[]): T;
}

export type ElementOf<T extends unknown[]> = T extends (infer U)[] ? U : never;
