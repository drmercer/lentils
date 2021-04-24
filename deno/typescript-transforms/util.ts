import ts from './typescript.ts';
import type { ts as TS } from './typescript.ts';

export function parse(source: string): TS.SourceFile {
  return ts.createSourceFile("parsed.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

export function transformChildren(node: TS.Node, transformFn: (child: TS.Node) => string|undefined): string {
  const source: string = node.getText();
  const sourceStart: number = node.getStart();

  const replacements: [child: TS.Node, replacementText: string][] = [];

  ts.forEachChild(node, (child): void => {
    const text = transformFn(child);
    if (text !== undefined) {
      replacements.push([child, text]);
    }
  });

  return insertReplacements(source, sourceStart, replacements);
}

export function transformAll(nodes: readonly TS.Node[], transformFn: (child: TS.Node) => string | undefined): string {
  if (!nodes[0]) {
    return '';
  }
  const source: string = nodesText(nodes);
  const sourceStart: number = nodes[0].getFullStart();

  const replacements: [child: TS.Node, replacementText: string][] = [];

  nodes.forEach((child): void => {
    const text = transformFn(child);
    if (text !== undefined) {
      replacements.push([child, text]);
    }
  });

  return insertReplacements(source, sourceStart, replacements);
}

function insertReplacements(source: string, sourceStart: number, replacements: [child: TS.Node, replacementText: string][]): string {
  if (replacements.length === 0) {
    return source;
  }

  return replacements
    .reverse() // indexes count from the beginning so we have to count from the end
    .reduce((src, [child, replacementText]) => {
      const start = child.getStart() - sourceStart;
      const end = child.end - sourceStart;
      return src.substring(0, start) + replacementText + src.substring(end);
    }, source);
}

export function mapPropertyAccesses(node: TS.Node, transformFn: (propertyName: string, target: string) => string|undefined): string {
  return transformChildren(node, (child) => {
    if (ts.isPropertyAccessExpression(child)) {
      const target = child.expression.getText();
      const property = child.name.text;
      return transformFn(property, target);
    } else {
      return mapPropertyAccesses(child, transformFn);
    }
  })
}

export function nodesText(s: readonly TS.Node[]): string {
  const [s1] = s;
  const s2 = s[s.length - 1];
  if (!s1) {
    return '';
  } else if (s1 === s2) {
    return s1.getFullText();
  } else {
    return s1.getSourceFile().text.substring(s1.getFullStart(), s2.getEnd());
  }
}

export function getBoundNames(node: TS.Node): Set<string> {
  const names = new Set<string>();
  _getBoundNames(node, names);
  return names;
}

function _getBoundNames(node: TS.Node, names: Set<string>): void {
  if (ts.isVariableDeclaration(node)) {
    _getBoundNamesFromBindingName(node.name, names);
  } else if (ts.isFunctionDeclaration(node)) {
    if (node.name) {
      names.add(node.name.text);
    }
  } else if (ts.isClassLike(node)) {
    if (node.name) {
      names.add(node.name.text);
    }
  } else if (ts.isParameter(node)) {
    _getBoundNamesFromBindingName(node.name, names);
  }
  ts.forEachChild(node, (child) => {
    _getBoundNames(child, names);
  });
}

function _getBoundNamesFromBindingName(node: TS.BindingName, names: Set<string>): void {
  if (ts.isIdentifier(node)) {
    names.add(node.text);
  } else {
    Array.from(node.elements).map(element => {
      if (ts.isBindingElement(element)) {
        _getBoundNamesFromBindingName(element.name, names);
      }
    });
  }
}
