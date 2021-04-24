import ts from './typescript.ts';
import type { ts as TS } from './typescript.ts';

export function transformChildren(node: TS.Node, transformFn: (child: TS.Node) => string|undefined): string {
  const source: string = node.getText();

  const replacements: [child: TS.Node, replacementText: string][] = [];

  ts.forEachChild(node, (child): void => {
    const text = transformFn(child);
    if (text !== undefined) {
      replacements.push([child, text]);
    }
  });

  if (replacements.length === 0) {
    return source;
  }

  return replacements
    .reverse() // indexes count from the beginning so we have to count from the end
    .reduce((src, [child, replacementText]) => {
      const start = child.getStart();
      const end = child.end;
      return src.substring(0, start) + replacementText + src.substring(end);
    }, source)
    .replaceAll(/ +$/gm, '') // trim trailing spaces
}
