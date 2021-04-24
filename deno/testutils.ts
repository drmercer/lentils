import { demargin } from 'https://danmercer.net/deno/common/string/string.ts';
/**
 * This exists to make assertEquals diff large texts nicely (by
 * defining a Deno.customInpsect method)
 */
class Src {
  constructor(public readonly text: string) { }

  public [Deno.customInspect]() {
    return this.text;
  }
}

export function src(parts: string): Src
export function src(parts: TemplateStringsArray, ...interpolations: unknown[]): Src
export function src(parts: TemplateStringsArray | string, ...interpolations: unknown[]): Src {
  const text = demargin(parts, ...interpolations);
  return new Src(text);
}
