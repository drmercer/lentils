import { isString } from '../../common/types/checks.ts';
import { Emitter } from '../../common/events/emitter.ts';
import { standardTemplate, demargin } from 'https://esm.sh/@drmercer/lentils/cjs/common/string/string.js';
import { makeInjector, injectable } from 'https://unpkg.com/@drmercer/injector@0.3.0/injector.ts';
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

  const A = injectable(() => {
    return {
      foo: 'a',
    };
  });

  const B = injectable((inject) => {
    const a = inject(A);
    function getA(): unknown {
      return a;
    }

    return {
      getA,
      bar: 'b' + a.foo,
    };
  });

  const C = injectable((inject) => {
    const a = inject(A);
    const b = inject(B);
    return {
      bagel: 'c' + a.foo + b.bar,
    };
  });

  const inject = makeInjector();
  const c = inject(C);
  const b = inject(B)
  const a = inject(A);

  assertEquals(b.bar, 'ba');
  assertEquals(c.bagel, 'caba');

  assertEquals(b.getA(), a);

});
