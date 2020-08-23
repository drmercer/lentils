import { isString } from '../node_modules/lentils/common/types/checks.ts';
import { Emitter } from '../node_modules/lentils/common/events/emitter.ts';

Deno.test("isString is function", () => {
  typeof isString === 'function';
});

Deno.test("Emitter works", () => {
  let called = false;
  const callback = () => called = true;
  const emitter = new Emitter<void>('deno-test-emitter');
  emitter.listen(callback)
  emitter.emit();
})
