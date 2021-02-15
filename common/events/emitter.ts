type ListenerFn<T> = (event: T) => void

interface Listener<T> {
  callback: ListenerFn<T>;
  context?: unknown;
}

export interface ReadonlyEmitter<T> {
  listen(callback: ListenerFn<T>, context: unknown): void;
  unlisten(callback: ListenerFn<T>, context: unknown): void;
  next(): Promise<T>;
}

export class Emitter<T> implements ReadonlyEmitter<T> {
  private listeners: Listener<T>[] = [];

  constructor(private name: string) {
  }

  /**
   * Registers a new listener
   * @param callback
   * @param context
   */
  public listen(
    callback: ListenerFn<T>,
    context: unknown = undefined,
  ): void {
    if (this.listeners.find(l => l.callback == callback)) {
      console.warn(`Emitter "${this.name}": the "${callback.name}" listener was registered multiple times.`);
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

  /**
   * Fires an event
   * @param event
   */
  public emit(event: T) {
    for (const l of this.listeners) {
      l.callback.call(l.context, event);
    }
  }

  /**
   * Unregisters a listener
   * @param callback
   * @param context
   */
  public unlisten(
    callback: ListenerFn<T>,
    context: unknown = undefined,
  ) {
    const sizeBefore = this.listeners.length;
    this.listeners = this.listeners.filter(l => !(l.callback === callback && l.context === context));
    const sizeAfter = this.listeners.length;
    if (sizeAfter === sizeBefore) {
      console.warn(`Emitter "${this.name}": the fn named "${callback.name}" was not found in the current listeners list`);
      debugger;
    }
  }
}
