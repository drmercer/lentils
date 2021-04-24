import { assertEquals } from 'https://deno.land/std@0.93.0/testing/asserts.ts';
import {getBoundNames, parse} from './util.ts';

Deno.test('getBoundNames should work on a basic statement', () => {
  const sf = parse('const foo = "bar";');
  const names = getBoundNames(sf);
  assertEquals(names, new Set(['foo']));
});

Deno.test('getBoundNames should work on object destructuring', () => {
  const sf = parse('const {a, b} = "bar";');
  const names = getBoundNames(sf);
  assertEquals(names, new Set(['a', 'b']));
});

Deno.test('getBoundNames should work on complex object destructuring', () => {
  const sf = parse('const {a: {c, d}, b} = "bar";');
  const names = getBoundNames(sf);
  assertEquals(names, new Set(['c', 'd', 'b']));
});

Deno.test('getBoundNames should work on array destructuring', () => {
  const sf = parse('const [a, , b] = "bar";');
  const names = getBoundNames(sf);
  assertEquals(names, new Set(['a', 'b']));
});

Deno.test('getBoundNames should work on complex array destructuring', () => {
  const sf = parse('const [a, , [b, c = "foo"]] = "bar";');
  const names = getBoundNames(sf);
  assertEquals(names, new Set(['a', 'b', 'c']));
});

Deno.test('getBoundNames should work on nested statements', () => {
  const sf = parse('const a = () => { const b = 1; };');
  const names = getBoundNames(sf);
  assertEquals(names, new Set(['a', 'b']));
});

Deno.test('getBoundNames should work on functions', () => {
  const sf = parse('function a() { const b = 1; }');
  const names = getBoundNames(sf);
  assertEquals(names, new Set(['a', 'b']));
});

Deno.test('getBoundNames should work on class declarations', () => {
  const sf = parse('class C {}');
  const names = getBoundNames(sf);
  assertEquals(names, new Set(['C']));
});

Deno.test('getBoundNames should work on class expressions', () => {
  const sf = parse('const b = class C {}');
  const names = getBoundNames(sf);
  assertEquals(names, new Set(['b', 'C']));
});