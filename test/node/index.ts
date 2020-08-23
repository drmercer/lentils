import { isString } from "lentils/common/types/checks";
import { Emitter } from "lentils/common/events/emitter";

try {
  if (!isString('foo')) throw new Error('isString is broken');

  if (typeof (new Emitter('foo')) !== "object") throw new Error();

  console.log("Node test successful!");
} catch (err) {
  console.error(err);
  process.exit(1);
}
