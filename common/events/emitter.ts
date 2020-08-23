type ListenerFn<T> = (event: T) => void

interface Listener<T> {
  callback: ListenerFn<T>;
  context?: unknown;
}

function fnToString(f: Function) {
  return `${f.name}: ${f.toString().replace(/\s+/g, ' ')}`;
}

export class Emitter<T> {
  private listeners: Listener<T>[] = [];

  private registeredCallbacks: Set<string> | undefined = undefined;

  constructor(private name: string) {
    if (process.env.NODE_ENV === 'development') {
      this.registeredCallbacks = new Set();
    }
  }

  public listen(
    callback: ListenerFn<T>,
    context: unknown = undefined,
  ): void {
    if (process.env.NODE_ENV === 'development') {
      const str = fnToString(callback);
      if (this.registeredCallbacks!.has(str)) {
        console.warn(`Emitter "${this.name}": multiple listeners registered that look like "${str}"!`);
      }
      this.registeredCallbacks!.add(str);
    }

    this.listeners.push({
      callback: callback as ListenerFn<unknown>,
      context,
    });
  }

  public next(): Promise<T> {
    return new Promise(resolve => {
      const f = (e: T) => {
        resolve(e);
        this.unlisten(f);
      };
      this.listen(f);
    })
  }

  public emit(event: T) {
    for (const l of this.listeners) {
      l.callback.call(l.context, event);
    }
  }

  public unlisten(
    callback: ListenerFn<any>,
    context: unknown = undefined,
  ) {
    const sizeBefore = this.listeners.length;
    this.listeners = this.listeners.filter(l => !(l.callback === callback && l.context === context));

    if (process.env.NODE_ENV === 'development') {
      const sizeAfter = this.listeners.length;
      if (sizeAfter === sizeBefore) {
        console.warn(`Emitter "${this.name}": no listener found when unlisten was called with ${fnToString(callback)}`);
        debugger;
      }
      this.registeredCallbacks!.delete(fnToString(callback));
    }
  }
}
