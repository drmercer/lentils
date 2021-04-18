import { isNonNull } from '../denoified-common/types/checks.ts';
import { demargin } from '../denoified-common/string/string.ts';

import ts from './typescript.ts';
import type { ts as TS } from './typescript.ts';

if (import.meta.main) {
  console.log("Running...");

  const file = Deno.args[0];

  const source = await Deno.readTextFile(file);

  console.log(transform(source));
}

/**
 * Given TS source of a v1 Injectable, attempts to rewrite it as a v2 injectable.
 *
 * Known limitations:
 * - public properties are assumed to be readonly (because that should be true)
 * - any occurrence of "this." inside method bodies will be removed, even in strings or comments
 * - getters/setters are not supported
 */
export function transform(source: string): string {
  const sourceFile = ts.createSourceFile("yeet.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  const updatedStatements = sourceFile.statements.map((statement): ([TS.Statement, string] | undefined) => {
    if (ts.isClassDeclaration(statement) && statement.decorators?.[0]) {
      const injectableDecorator = statement.decorators.find(node => {
        return ts.isCallExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.escapedText === "Injectable";
      });
      if (injectableDecorator) {
        const name = statement.name?.escapedText ?? "<unnamed>";
        console.log(`Found @Injectable class ${name}`);
        const newStatements = injectableClassToInjectableFunction(statement);
        return [statement, newStatements];
      }
    }
    if (ts.isImportDeclaration(statement)) {
      let text = statement.getText()
      if (text.includes("/v1/injector")) {
        if (!/\binjectable\b/.test(text)) {
          text = text.replace(/(\s*\})/, ", injectable$1");
        }
        if (!/\bInjectedValue\b/.test(text)) {
          text = text.replace(/(\s*\})/, ", InjectedValue$1");
        }
        text = text
          .replace("/v1/injector", "/v2bc/injector")
          .replace(/\bInjectable(?:,\s*)?/, '')
        return [statement, text];
      }
    }
    return undefined; // means no change
  });

  return updatedStatements
    .filter(isNonNull)
    .map(([oldStatement, newText]) => {
      return [oldStatement.getStart(), oldStatement.end, newText] as const;
    })
    .reverse() // indexes count from the beginning so we have to count from the end
    .reduce((src, [start, end, replacement]) => {
      return src.substring(0, start) + replacement + src.substring(end);
    }, source)
    .replaceAll(/ +$/gm, '') // trim trailing spaces
}

function injectableClassToInjectableFunction(statement: TS.ClassDeclaration): string {
  const className = statement.name!.escapedText.toString();
  return `
export type ${className} = InjectedValue<typeof ${className}>;

export const ${className} = injectable('${className}', (inject) => {
  ${injectableClassMembersToStatements(statement.members).replaceAll(/\n/g, '\n  ')}
});
`.trim();
}

function injectableClassMembersToStatements(members: readonly TS.ClassElement[]): string {
  const exported: string[] = [];
  const ctor = members.find(m => ts.isConstructorDeclaration(m)) as TS.ConstructorDeclaration;
  let injections: string[];
  if (ctor) {
    const params = ctor.parameters.map(p => {
      const name: string = ts.isIdentifier(p.name) ? p.name.escapedText.toString() : p.name.toString();
      const typeName: string = p.type && ts.isTypeReferenceNode(p.type) && ts.isIdentifier(p.type.typeName) && p.type.typeName.escapedText.toString() || "null as any";
      const isPublic = p.modifiers?.some(m => m.kind === ts.SyntaxKind.PublicKeyword) ?? false;
      return {name, typeName, isPublic};
    });
    injections = params.map(({name, typeName}) => {
      return `const ${name} = inject(${typeName});`;
    });
    const exportedParams = params.filter(({isPublic}) => isPublic).map(({name}) => name);
    exported.push(...exportedParams);
  } else {
    injections = [];
  }
  const transformedMembers: string[] = members
    .map<string>(m => {
      if (ts.isConstructorDeclaration(m)) {
        return demargin(removeThis(nodesText(Array.from(m.body?.statements ?? []))));
      }
      const name: string = !m.name ? "" : ts.isIdentifier(m.name) ? m.name.escapedText.toString() : m.name.toString();
      const isPublic: boolean = !m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.PrivateKeyword);
      if (name && isPublic) {
        exported.push(name);
      }
      const comment = demargin(m.getSourceFile().text.substr(m.getFullStart(), m.getLeadingTriviaWidth()));
      if (ts.isPropertyDeclaration(m)) {
        // Known bug: non-readonly public properties are not properly exposed
        const isReadonly = isPublic || (m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ReadonlyKeyword) ?? false);
        const initializer = m.initializer?.getText();
        const type = m.type?.getText();
        return `${comment}${isReadonly ? 'const' : 'let'} ${name}${type ? ': ' + type : ''}${initializer ? ' = ' + initializer : ''};`;
      } else if (ts.isMethodDeclaration(m)) {
        const async: boolean = m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
        const typeParams = m.typeParameters ? `<${nodesText(m.typeParameters)}>` : '';
        const params = m.parameters ? nodesText(m.parameters) : '';
        const body = demargin(removeThis(nodesText(Array.from(m.body?.statements ?? []))))
          .trim()
          .split('\n')
          .join('\n  ');
        return `
${comment}${async ? 'async ' : ''}function ${name}${typeParams}(${params}) {
  ${body}
}`.trim();
      } else {
        console.warn("Unrecognized member kind: ", m.kind);
        return '';
      }
    })
    .filter(isTruthy);
  return [
    injections.join('\n'),
    ...transformedMembers,
    returnedObject(exported),
  ].join('\n\n');
}

function returnedObject(names: string[]): string {
  if (names.length === 0) {
    return 'return {};';
  }
  return `
return {
  ${names.sort().join(',\n  ')},
};`.trim();
}

function removeThis(text: string): string {
  return text.replaceAll(/\bthis\./g, ''); // TODO make more robust somehow?
}

function nodesText(s: readonly TS.Node[]): string {
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

function isTruthy<T>(x: T): x is Exclude<T, 0|false|null|undefined|typeof NaN|''> {
  return !!x;
}

// AST helpers

function constDeclaration(name: string, type?: TS.TypeNode, initializer?: TS.Expression, exported = false) {
  return ts.factory.createVariableStatement(
    [
      exported ? ts.factory.createToken(ts.SyntaxKind.ExportKeyword) : undefined
    ].filter(isNonNull),
    ts.factory.createVariableDeclarationList([
      ts.factory.createVariableDeclaration(name, undefined, type, initializer),
    ], ts.NodeFlags.Const)
  );
}

function todoStatement(message?: string) {
  return ts.factory.createThrowStatement(
    ts.factory.createNewExpression(
      ts.factory.createIdentifier("Error"),
      undefined,
      [
        ts.factory.createStringLiteral("TODO" + (message ? ": " + message : ""), true),
      ]
    ),
  );
}