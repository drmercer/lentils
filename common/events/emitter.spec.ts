import { Emitter } from './emitter';
import { withNoLogs, withExactLogs } from '../../jest/testutils';

interface MyEvent {
  foo: string,
}

describe('Emitter', () => {

  it('should emit events', withNoLogs(() => {
    process.env.NODE_ENV = 'development';
    const e = new Emitter<MyEvent>('my-event');
    const listener = jest.fn();

    e.listen(listener);
    e.emit({ foo: "hello" });

    expect(listener).toHaveBeenCalledWith({ foo: "hello" });
  }));

  it('should warn when a listener is attached multiple times', withExactLogs({
    warn: [
      'Emitter "my-event": multiple listeners registered that look like "mockConstructor: function () { return fn.apply(this, arguments); }"!'
    ]
  }, () => {
    process.env.NODE_ENV = 'development';
    const e = new Emitter<MyEvent>('my-event');
    const listener = jest.fn();

    e.listen(listener);
    e.listen(listener);
    e.emit({ foo: "hello" });

    expect(listener).toHaveBeenCalledWith({ foo: "hello" });
  }));

  it('should not emit events after unlisten has been called', withNoLogs(() => {
    process.env.NODE_ENV = 'development';
    const e = new Emitter<MyEvent>('my-event');
    const listener = jest.fn();

    e.listen(listener);
    e.unlisten(listener);
    e.emit({ foo: "hello" });

    expect(listener).not.toHaveBeenCalled();
  }));
})
