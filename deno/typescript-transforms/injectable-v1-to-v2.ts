import { demargin } from '../denoified-common/string/string.ts';

import ts from './typescript.ts';
import type { ts as TS } from './typescript.ts';
import { mapPropertyAccesses, nodesText, parse, transformAll, transformChildren } from "./util.ts";

if (import.meta.main) {
  console.log("Running...");

  const file = Deno.args[0];

  const source = await Deno.readTextFile(file);

  const transformed = transform(source);

  await Deno.writeTextFile(file, transformed);

  console.log("Done");
}

/**
 * Given TS source of a v1 Injectable, attempts to rewrite it as a v2 injectable.
 *
 * Known limitations:
 * - public properties are assumed to be readonly (because that should be true)
 * - getters/setters are not supported
 */
export function transform(source: string): string {
  const sourceFile = parse(source);

  return transformChildren(sourceFile, (statement: TS.Node) => {
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
        return newStatements;
      }
    }
    if (ts.isImportDeclaration(statement)) {
      let text = statement.getText()
      const injectorPathRegex = /\/v[12](bc)?\/injector/;
      if (injectorPathRegex.test(text)) {
        if (!/\binjectable\b/.test(text)) {
          text = text.replace(/(\s*\})/, ", injectable$1");
        }
        if (!/\bInjectedValue\b/.test(text)) {
          text = text.replace(/(\s*\})/, ", InjectedValue$1");
        }
        text = text
          .replace(injectorPathRegex, "/v2bc/injector")
          .replace(/\bInjectable(?:,\s*)?/, '')
        return text;
      }
    }
    return undefined; // means no change
  }).replaceAll(/ +$/gm, '') // trim trailing spaces)
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
  const ctor = members.find(m => ts.isConstructorDeclaration(m)) as TS.ConstructorDeclaration;
  const {exported, injections} = ctor ? ctorParamsToInjections(ctor.parameters) : {exported: [], injections: []};
  const transformedMembers: string[] = members
    .map<string>(m => {
      if (ts.isConstructorDeclaration(m)) {
        return demargin(transformAll(m.body?.statements ?? [], removeThis));
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
        const body = demargin(transformAll(m.body?.statements ?? [], removeThis))
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
  ].join('\n\n').trim();
}

function ctorParamsToInjections(parameters: TS.NodeArray<TS.ParameterDeclaration>) {
  const params = parameters.map(p => {
    const name: string = ts.isIdentifier(p.name) ? p.name.escapedText.toString() : p.name.toString();
    const typeName: string = p.type && ts.isTypeReferenceNode(p.type) && ts.isIdentifier(p.type.typeName) && p.type.typeName.escapedText.toString() || "null as any";
    const isPublic = p.modifiers?.some(m => m.kind === ts.SyntaxKind.PublicKeyword) ?? false;
    return { name, typeName, isPublic };
  });
  const injections = params.map(({ name, typeName }) => {
    return `const ${name} = inject(${typeName});`;
  });
  const exported = params.filter(({ isPublic }) => isPublic).map(({ name }) => name);
  return {
    injections,
    exported,
  };
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

function removeThis(node: TS.Node): string {
  return mapPropertyAccesses(node, (propertyName, target) => {
    if (target === 'this') {
      return propertyName;
    }
  });
}

function isTruthy<T>(x: T): x is Exclude<T, 0 | false | null | undefined | typeof NaN | ''> {
  return !!x;
}
