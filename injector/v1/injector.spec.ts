import { Injectable, Injector } from './injector';

@Injectable()
class TestInjectableA {
  public readonly foo: string = 'Hello, world!';
}

@Injectable()
class TestInjectableB {
  constructor(public a: TestInjectableA) {
  }
}

describe('injector', () => {
  it('should work', () => {
    const injector = new Injector();
    const b = injector.get(TestInjectableB);
    const a = injector.get(TestInjectableA)
    expect(b).toBeInstanceOf(TestInjectableB);
    expect(a).toBeInstanceOf(TestInjectableA);
    expect(b.a).toBe(a);
  })
})
