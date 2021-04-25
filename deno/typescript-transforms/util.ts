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
  return mapStuff(node, {
    propertyAccesses: transformFn,
  });
}

export function mapIdentifierUsages(node: TS.Node, transformFn: (identifier: string) => string | undefined): string {
  return mapStuff(node, {
    identifierUsages: transformFn
  });
}

export function mapStuff(
  node: TS.Node,
  mappers: {
    propertyAccesses?: (propertyName: string, target: string) => string | undefined,
    identifierUsages?: (identifier: string) => string | undefined,
  } = {},
): string {
  function shouldTransformIdentifier(node: TS.Identifier | TS.PrivateIdentifier): boolean {
    const parent = node.parent;
    if (ts.isFunctionDeclaration(parent)) {
      return false;
    } else if (ts.isClassLike(parent)) {
      return false;
    } else if (ts.isParameter(parent)) {
      return false;
    } else if (ts.isBindingElement(parent)) {
      return false;
    } else if (ts.isPropertyAccessExpression(parent)) {
      return node === parent.expression;
    } else {
      return true;
    }
  }
  return transformChildren(node, (child) => {
    if (mappers.propertyAccesses && ts.isPropertyAccessExpression(child)) {
      const target = child.expression.getText();
      const property = child.name.text;
      const mapped = mappers.propertyAccesses(property, target);
      if (mapped) {
        return mapped;
      }
    } else if (mappers.identifierUsages && ts.isIdentifierOrPrivateIdentifier(child)) {
      if (shouldTransformIdentifier(child)) {
        return mappers.identifierUsages(child.text);
      } else {
        return undefined;
      }
    }
    return mapStuff(child, mappers);
  })
}

export function returnedObject(names: string[]): string {
  if (names.length === 0) {
    return 'return {};';
  }
  return `
return {
  ${names.sort().join(',\n  ')},
};`.trim();
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

export function getBoundNames(node: TS.Node, names: Set<string> = new Set()): Set<string> {
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
    getBoundNames(child, names);
  });
  return names;
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

export function demarginExceptFirstLine(text: string): string {
  const [firstLine, ...otherLines] = text.split('\n');
  if (!otherLines.length) {
    return text;
  }
  return firstLine + '\n' + demargin(otherLines.join('\n'));
}

export function demargin(text: string): string {
  const marginSize = text
    .split('\n')
    .filter(line => !!line)
    .map(line => line.match(/^[ \t]*/)![0].length)
    .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY);
  if (!Number.isFinite(marginSize)) {
    return text;
  }
  const marginRegex = new RegExp(`^[ \t]{0,${marginSize}}`, 'mg');
  return text
    .replace(marginRegex, '');
}

export function indent(text: string, levels: number): string {
  const padding = Array.from({ length: levels }, () => '  ').join('');
  return text.replaceAll(/\n/g, '\n' + padding);
}

export function capitalize(name: string): string {
  return name.substr(0, 1).toUpperCase() + name.substr(1);
}
