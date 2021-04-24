import { assertEquals } from 'https://deno.land/std@0.93.0/testing/asserts.ts';
import {getBoundNames, mapIdentifierUsages, mapPropertyAccesses, parse} from './util.ts';

Deno.test('mapPropertyAccesses should work', () => {
  const sf = parse('function a() { return this.b; }');
  const result = mapPropertyAccesses(sf, (name, target) => name + '.yeet.' + target);
  assertEquals(result, 'function a() { return b.yeet.this; }');
});

Deno.test('mapPropertyAccesses should work with chained property accesses', () => {
  const sf = parse('function a() { return this.b.foo(); }');
  const result = mapPropertyAccesses(sf, (name, target) => (name === 'b') ? 'bagel' : undefined);
  assertEquals(result, 'function a() { return bagel.foo(); }');
});

Deno.test('mapIdentifierUsages should not affect function names', () => {
  const sf = parse('function a() { return b; }');
  const result = mapIdentifierUsages(sf, (name) => name + '.yeet');
  assertEquals(result, 'function a() { return b.yeet; }');
});

Deno.test('mapIdentifierUsages should not affect properties accessed', () => {
  const sf = parse('b.c;');
  const result = mapIdentifierUsages(sf, (name) => name + '.yeet');
  assertEquals(result, 'b.yeet.c;');
});

Deno.test('mapIdentifierUsages should not affect class declarations', () => {
  const sf = parse('class Foo{ constructor() { b(); } }');
  const result = mapIdentifierUsages(sf, (name) => name + '.yeet');
  assertEquals(result, 'class Foo{ constructor() { b.yeet(); } }');
});

Deno.test('mapIdentifierUsages should not affect function parameters', () => {
  const sf = parse('function a(b) { return c; }');
  const result = mapIdentifierUsages(sf, (name) => name + '.yeet');
  assertEquals(result, 'function a(b) { return c.yeet; }');
});

Deno.test('mapIdentifierUsages should not affect destructuring', () => {
  const sf = parse('function a(b) { const {c} = b; }');
  const result = mapIdentifierUsages(sf, (name) => name + '.yeet');
  assertEquals(result, 'function a(b) { const {c} = b.yeet; }');
});

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

Deno.test('getBoundNames should work on function parameters', () => {
  const sf = parse('const b = (c: string) => 2;');
  const names = getBoundNames(sf);
  assertEquals(names, new Set(['b', 'c']));
});
