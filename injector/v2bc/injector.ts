import { makeInjector as v2makeInjector, Override } from '../v2/injector';
import { isArray, isFunction, isUndefined } from '../../common/types/checks';
import { Constructor } from '../../common/types/meta';
import 'reflect-metadata';
import { InjectKey, injectable as v2injectable } from '../v2/injector';

export type { InjectKey };
export { override } from '../v2/injector';

export type AbstractInjectKey<T> = InjectKey<T> | Constructor<T>;

const injectKeyForParam = Symbol("injectKeyForParam");
const injectKeyForCtor = Symbol("injectKeyForCtor");

export function UseInjectKey<T>(key: InjectKey<T>) {
  return function (target: Constructor<unknown>, propertyKey: string, parameterIndex: number): void {
    if (propertyKey !== undefined) {
      throw new Error("UseInjectKey must only be used on the constructor!");
    }
    const keysByParameter: Map<number, InjectKey<unknown>> = getParamInjectKeys(target);
    keysByParameter.set(parameterIndex, key);
    Reflect.defineMetadata(injectKeyForParam, keysByParameter, target);
  }
}

function getParamInjectKeys(target: Constructor<unknown>): Map<number, InjectKey<unknown>> {
  return Reflect.getOwnMetadata(injectKeyForParam, target) || new Map();
}

function getCtorDeps<T>(ctor: Constructor<T>): AbstractInjectKey<unknown>[] {
  const metadata: unknown = Reflect.getMetadata('design:paramtypes', ctor);
  if (isArray(metadata) && metadata.every(isFunction)) {
    const ctors = metadata as Constructor<unknown>[];
    const paramKeys = getParamInjectKeys(ctor);
    const fullParamKeys = ctors.map((c, idx) => paramKeys.get(idx) || c);
    const badIndex = fullParamKeys.findIndex(c => c === Object);
    if (badIndex >= 0) {
      console.warn('Possibly missing @UseInjectKey on ' + (badIndex + 1) + 'th parameter for ' + ctor.name);
    }
    return fullParamKeys;
  } else {
    if (!isUndefined(metadata)) {
      console.warn(`Found weird metadata for Constructor '${ctor.name}':`, metadata);
    }
    return [];
  }
}

/**
 * @deprecated replace with injectable() instead
 */
export function Injectable() {
  return function (ctor: Constructor<unknown>) {
    const deps = getCtorDeps(ctor);
    const key = injectable(ctor.name, (inject) => {
      const fulfilledDeps = deps.map(inject);
      return new ctor(...fulfilledDeps);
    });
    Reflect.defineMetadata(injectKeyForCtor, key, ctor);
  }
}

function getCtorKey<T>(ctor: Constructor<T>): InjectKey<T> {
  const key = Reflect.getMetadata(injectKeyForCtor, ctor);
  if (!key) {
    throw new Error(ctor.name + " is not Injectable!");
  }
  return key as InjectKey<T>;
}

function getV2Key<T>(key: AbstractInjectKey<T>): InjectKey<T> {
  if (key === Injector as unknown) {
    return injectorKey as unknown as InjectKey<T>;
  }
  return isFunction(key) ? getCtorKey(key) : key;
}

function makeInject(v2inject: <T>(key: InjectKey<T>) => T): <T>(key: AbstractInjectKey<T>) => T {
  return key => {
    return v2inject(getV2Key(key));
  };
}

export class Injector {
  constructor(
    public readonly get: <T>(key: AbstractInjectKey<T>) => T,
  ) { }
}

const injectorKey = injectable<Injector>('Injector', (inject) => {
  return new Injector(inject);
});

export function makeInjector(overrides: Override<unknown>[] = []): [<T>(key: AbstractInjectKey<T>) => T] {
  const [v2get] = v2makeInjector(overrides);

  const get = makeInject(v2get);

  return [get];
}

export type InjectedValue<K extends AbstractInjectKey<unknown>> = K extends AbstractInjectKey<infer T> ? T : never;

export function injectable<T>(
  name: string,
  factory: (inject: <U>(key: AbstractInjectKey<U>) => U) => T,
): InjectKey<T> {
  return v2injectable(name, (v2inject) => {
    return factory(makeInject(v2inject));
  });
}
