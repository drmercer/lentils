import { isString } from '../../common/types/checks.ts';
import { Emitter } from '../../common/events/emitter.ts';
import { standardTemplate, demargin } from '../../deno/denoified-common/string/string.ts';
import { Injector, injectable } from '../../injector/v2/injector.ts';
import { assertEquals } from "https://deno.land/std@0.77.0/testing/asserts.ts";

Deno.test("isString is function", () => {
  typeof isString === 'function';
});

Deno.test("Emitter works", () => {
  let called = false;
  const callback = () => called = true;
  const emitter = new Emitter<void>('deno-test-emitter');
  emitter.listen(callback)
  emitter.emit();
});

Deno.test("standardTemplate works", () => {
  const s = standardTemplate`foo ${1} bar ${2}`;
  assertEquals(s, "foo 1 bar 2");
});

Deno.test("demargin works", () => {
  const s = demargin`
    foo ${1}
    bar ${2}
  `;
  assertEquals(s, "foo 1\nbar 2\n");
});

Deno.test("Injector v2 works", () => {

  const A = injectable('A', () => {
    return {
      foo: 'a',
    };
  });

  const B = injectable('B', A, (a) => {
    function getA(): unknown {
      return a;
    }

    return {
      getA,
      bar: 'b' + a.foo,
    };
  });

  const C = injectable('C', A, B, Injector.Self, (a, b, injector) => {
    return {
      bagel: 'c' + a.foo + b.bar,
      injector,
    };
  });

  const injector = new Injector();
  const c = injector.get(C);
  const b = injector.get(B)
  const a = injector.get(A);

  assertEquals(b.bar, 'ba');
  assertEquals(c.bagel, 'caba');

  assertEquals(b.getA(), a);
  assertEquals(c.injector, injector);

});
