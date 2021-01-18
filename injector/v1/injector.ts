import { isArray, isFunction, isUndefined, isString } from '../../common/types/checks';
import { Constructor } from '../../common/types/meta';
import 'reflect-metadata';

const isInjectableKey = 'dm:injectable';

/**
 * Use this to mark a class as Injectable. It can then be injected into other
 * Injectables, and it can be gotten from the Injector via Injector#get().
 *
 * To inject these Injectables into Vue components, see my VueInjector plugin.
 */
export function Injectable() {
  return function (ctor: Constructor<unknown>) {
    Reflect.defineMetadata(isInjectableKey, true, ctor);
  }
}

export function isInjectable(ctor: Constructor<unknown>): boolean {
  return !!Reflect.getMetadata(isInjectableKey, ctor);
}

// TODO tighten up types?

/**
 * A standalone dependency injector for TypeScript. Requires reflect-metadata.
 */
export class Injector {
  private instances: WeakMap<Constructor<unknown>, any> = new WeakMap();
  /** Only for usage from debugger */
  private byName: Record<string, any> | undefined = process.env.NODE_ENV === 'development' ? {} : undefined;

  public get<T>(ctor: Constructor<T>): T {
    if (process.env.NODE_ENV === 'development' && this.byName && isString(ctor)) {
      return this.byName[ctor];
    }
    if (this.instances.has(ctor)) {
      return this.instances.get(ctor);
    }
    if (ctor === Injector as unknown) {
      return this as unknown as T;
    }
    const instance = this.create(ctor);
    this.instances.set(ctor, instance);
    if (process.env.NODE_ENV === 'development' && this.byName) {
      this.byName[ctor.name] = instance;
    }
    return instance;
  }

  private create<T>(ctor: Constructor<T>): T {
    const paramTypes = this.getCtorParams(ctor);
    const params = paramTypes.map(c => this.get(c));
    if (params.length !== ctor.length) {
      console.warn(`Expected ${ctor.length} parameters for ${ctor.name} constructor, but only found ${params.length}!`);
    }
    return new ctor(...params);
  }

  private getCtorParams<T>(ctor: Constructor<T>): Constructor<unknown>[] {
    if (!isInjectable(ctor)) {
      throw new Error(`${ctor.name} is not Injectable!`);
    }
    const metadata: unknown = Reflect.getMetadata('design:paramtypes', ctor);
    if (isArray(metadata) && metadata.every(isFunction)) {
      return metadata as Constructor<unknown>[];
    } else {
      if (!isUndefined(metadata)) {
        console.warn(`Found weird metadata for Constructor '${ctor.name}':`, metadata);
      }
      return [];
    }
  }
}
