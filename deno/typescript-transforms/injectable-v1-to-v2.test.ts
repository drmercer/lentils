import { transform } from './injectable-v1-to-v2.ts';
import { assertEquals } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { src } from '../testutils.ts';

Deno.test("it should work", () => {
  const input = src`
import {Injectable} from 'yeet/v1/injector";

const yeet = 'hi';

// test comment

@Injectable()
export default class Foo {
  constructor(
    public bagel: Bagel,
    private potato: Potato,
  ) {
    this.bagel = 'foo';
  }

  /**
   * Candy bar
   */
  private bar = 'hello';

  /**
   * Some yeets
   */
  public yeet(bar2: string) {
    console.log("hello", this.bar);

    // foo

    console.log("hello", this.bar2, bar2);
  }

  public bar2 = 'hello';
}

const yeet3 = 'hi';
  `;
  const actual = src(transform(input.text));
  const expected = src`
import {injectable, InjectedValue} from 'yeet/v2bc/injector";

const yeet = 'hi';

// test comment

export type Foo = InjectedValue<typeof Foo>;

export const Foo = injectable('Foo', (inject) => {
  const bagel = inject(Bagel);
  const potato = inject(Potato);

  bagel = 'foo';

  /**
   * Candy bar
   */
  let bar = 'hello';

  /**
   * Some yeets
   */
  function yeet(bar2: string) {
    console.log("hello", bar);

    // foo

    console.log("hello", $bar2, bar2);
  }

  const $bar2 = 'hello';

  return {
    bagel,
    bar2: $bar2,
    yeet,
  };
});

const yeet3 = 'hi';
  `;
  assertEquals(actual, expected);
});
