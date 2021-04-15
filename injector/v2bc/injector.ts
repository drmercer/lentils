import { isArray, isFunction, isUndefined, isString } from '../../common/types/checks';
import { Constructor } from '../../common/types/meta';
import 'reflect-metadata';

// V1 STUFF

const isInjectableKey = 'dm:injectable';

/**
 * @deprecated replace with injectable() instead
 */
export function Injectable() {
  return function (ctor: Constructor<unknown>) {
    Reflect.defineMetadata(isInjectableKey, true, ctor);
  }
}

export function isInjectable(ctor: Constructor<unknown>): boolean {
  return !!Reflect.getMetadata(isInjectableKey, ctor);
}


// COMPAT STUFF

export type AbstractInjectKey<T> = InjectKey<T> | Constructor<T>;

const injectKeyForParam = Symbol("injectKeyForParam");

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

// V2 STUFF

class InjectKey<T> {
  private IfYoureSeeingThisInAnErrorMessageItMeansYoureTryingToUseSomethingAsAnInjectKeyWhenItsNotOne!: T;
  constructor(
    public injectableName: string,
  ) { }
}
export type { InjectKey };

export type InjectedValue<K extends AbstractInjectKey<unknown>> = K extends AbstractInjectKey<infer T> ? T : never;

type DepValues<DepKeys extends readonly AbstractInjectKey<unknown>[]> = {
  [K in keyof DepKeys]: DepKeys[K] extends AbstractInjectKey<unknown> ? InjectedValue<DepKeys[K]> : never;
}

interface InjectableData<T> {
  deps: readonly AbstractInjectKey<unknown>[];
  factory: (...args: any) => T;
}

const metadata = new WeakMap<InjectKey<unknown>, InjectableData<unknown>>();

export function injectable<T, DepKeys extends readonly AbstractInjectKey<unknown>[]>(
  name: string,
  // Makes me sad that this signature isn't very clean, but at least it's user-friendly and doesn't require "as const"
  ...rest: [
    ...deps: DepKeys,
    factory: (...args: DepValues<DepKeys>) => T,
  ]
): InjectKey<T> {
  const deps = rest.slice(0, -1);
  const [factory] = rest.slice(-1);
  const key = new InjectKey<T>(name);
  metadata.set(key, {
    deps: deps as unknown as DepKeys,
    factory: factory as (...args: DepValues<DepKeys>) => T,
  });
  return key;
}

export interface Override<T> {
  overridden: InjectKey<T>;
  overrider: InjectKey<T>;
}

export function override<T>(overridden: InjectKey<T>) {
  return {
    withOther(overrider: InjectKey<T>): Override<T> {
      return { overridden, overrider };
    },
    withValue(value: T): Override<T> {
      return {
        overridden,
        overrider: injectable<T, []>('explicit value', () => value),
      };
    },
  };
}

export class Injector {
  public static Self: InjectKey<Injector> = new InjectKey('Injector');

  private instances: WeakMap<AbstractInjectKey<unknown>, any> = new WeakMap();
  private overrides: Map<InjectKey<unknown>, InjectKey<unknown>>;

  constructor(overrides: Override<unknown>[] = []) {
    this.overrides = new Map(overrides.map(o => [o.overridden, o.overrider]));
  }

  public get<T>(key: AbstractInjectKey<T>): T {
    return this._get(key, []);
  }

  private _get<T>(key: AbstractInjectKey<T>, overriddenKeys: InjectKey<T>[]): T {
    if (!isFunction(key) && this.overrides.has(key)) {
      // Compat ^ (only allow overriding InjectKeys)
      const overrider = this.overrides.get(key) as InjectKey<T>;
      const newOverriddenKeys = [...overriddenKeys, key];
      // Check for circular dependency
      if (newOverriddenKeys.includes(overrider)) {
        const message: string = [...newOverriddenKeys, overrider].map(k => k.injectableName).join(' -> ');
        throw new Error("Circular override dependencies: " + message);
      }
      return this._get(overrider, newOverriddenKeys);
    }
    if (this.instances.has(key)) {
      return this.instances.get(key);
    }
    if (key === Injector.Self as AbstractInjectKey<unknown>) {
      return this as unknown as T;
    }
    if (key === Injector as Constructor<unknown>) {
      // Compat
      return this as unknown as T;
    }
    const instance = this.create(key);
    this.instances.set(key, instance);
    return instance;
  }

  private create<T>(key: AbstractInjectKey<T>): T {
    if (isFunction(key)) {
      // Compat
      const paramTypes = this.getCtorParams(key);
      const params = paramTypes.map(c => this.get(c));
      if (params.length !== key.length) {
        console.warn(`Expected ${key.length} parameters for ${key.name} constructor, but only found ${params.length}!`);
      }
      return new key(...params);
    } else {
      const { factory, deps } = metadata.get(key) as InjectableData<T>;
      const depValues = deps.map(dep => this.get(dep));
      return factory(...depValues);
    }
  }

  // Compat
  private getCtorParams<T>(ctor: Constructor<T>): AbstractInjectKey<unknown>[] {
    if (!isInjectable(ctor)) {
      throw new Error(`${ctor.name} is not Injectable!`);
    }
    const metadata: unknown = Reflect.getMetadata('design:paramtypes', ctor);
    if (isArray(metadata) && metadata.every(isFunction)) {
      const ctors = metadata as Constructor<unknown>[];
      const paramKeys = getParamInjectKeys(ctor);
      return ctors.map((c, idx) => paramKeys.get(idx) || c);
    } else {
      if (!isUndefined(metadata)) {
        console.warn(`Found weird metadata for Constructor '${ctor.name}':`, metadata);
      }
      return [];
    }
  }
}
