import { isString } from "lentils/common/types/checks";

try {
  if (!isString('foo')) throw new Error('isString is broken');

  console.log("Node test successful!");
} catch (err) {
  console.error(err);
  process.exit(1);
}
