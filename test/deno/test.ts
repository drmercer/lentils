import { isString } from '../../common/types/checks.ts';
import { Emitter } from '../../common/events/emitter.ts';
import { standardTemplate, demargin } from '../../deno/denoified-common/string/string.ts';
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
