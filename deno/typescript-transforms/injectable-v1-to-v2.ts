import { isNonNull } from '../denoified-common/types/checks.ts';

import ts from './typescript.ts';
import type { ts as TS } from './typescript.ts';
import { demargin, demarginExceptFirstLine, getBoundNames, indent, mapPropertyAccesses, nodesText, parse, returnedObject, transformAll, transformChildren } from "./util.ts";

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
  ${indent(injectableClassMembersToStatements(statement.members), 1)}
});
`.trim();
}

interface Declaration {
  member: TS.ClassElement;
  name: string;
  renamedName?: string;
  exported: boolean;
}

function injectableClassMembersToStatements(members: readonly TS.ClassElement[]): string {
  const alreadyUsedNames = new Set<string>();
  members.forEach(m => getBoundNames(m, alreadyUsedNames));
  const ctor = members.find(m => ts.isConstructorDeclaration(m)) as TS.ConstructorDeclaration;
  const {exported, injections} = ctor ? ctorParamsToInjections(ctor.parameters) : {exported: [], injections: []};
  const declarations: Declaration[] = members
    .map<Declaration|undefined>(m => {
      if (ts.isConstructorDeclaration(m)) {
        return;
      }
      const name: string = !m.name ? "" : ts.isIdentifier(m.name) ? m.name.escapedText.toString() : m.name.toString();
      const isPublic: boolean = !m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.PrivateKeyword);
      let renamedName: string|undefined = undefined;
      while (alreadyUsedNames.has(renamedName || name)) {
        // need to rename
        renamedName = '$' + (renamedName || name);
      }
      return {
        member: m,
        name,
        renamedName,
        exported: isPublic,
      };
    })
    .filter(isNonNull);
  const renames = new Map<string, string>(
    declarations
      .filter(d => !!d.renamedName)
      .map(({name, renamedName}) => [name, renamedName!]),
  );
  const transformedMembers: string[] = members
    .map<string>(m => {
      if (ts.isConstructorDeclaration(m)) {
        return demargin(transformAll(m.body?.statements ?? [], (n) => removeThisAndDoRenames(n, renames)));
      }
      const d = declarations.find(d => d.member === m)!;
      const comment = demarginExceptFirstLine(m.getSourceFile().text.substr(m.getFullStart(), m.getLeadingTriviaWidth()));
      return comment + memberToStatement(m, d, renames);
    })
    .filter(isTruthy);
  const allExported = exported.concat(
    declarations
      .filter(d => d.exported)
      .map(d => d.name + (d.renamedName ? ': ' + d.renamedName : '')),
  );
  return [
    injections.join('\n'),
    '\n',
    ...transformedMembers,
    '\n\n',
    returnedObject(allExported),
  ].join('').trim();
}

function memberToStatement(m: TS.ClassElement, d: Declaration, renames: Map<string, string>) {
  const { name, exported: isPublic } = d;
  const newDeclarationName = renames.get(name) || name;
  if (ts.isPropertyDeclaration(m)) {
    const isReadonly = (m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ReadonlyKeyword) ?? false);
    const assumeIsReadonly = isReadonly || isPublic;
    if (!isReadonly && assumeIsReadonly) {
      console.warn(`WARNING: property ${name} is public, assuming it is readonly`);
    }
    const initializer = m.initializer ? removeThisAndDoRenames(m.initializer, renames) : undefined;
    const type = m.type?.getText();
    return `${assumeIsReadonly ? 'const' : 'let'} ${newDeclarationName}${type ? ': ' + type : ''}${initializer ? ' = ' + initializer : ''};`;
  } else if (ts.isMethodDeclaration(m)) {
    const async: boolean = m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
    const typeParams = m.typeParameters ? `<${nodesText(m.typeParameters)}>` : '';
    const returnType = m.type ? ': ' + m.type.getText() : '';
    const params = m.parameters ? nodesText(m.parameters) : '';
    const body = demargin(transformAll(m.body?.statements ?? [], (n) => removeThisAndDoRenames(n, renames)))
      .trim()
      .split('\n')
      .join('\n  ');
    return `
${async ? 'async ' : ''}function ${newDeclarationName}${typeParams}(${params})${returnType} {
  ${body}
}`.trim();
  } else {
    console.warn("Unrecognized member kind: ", m.kind);
    return '';
  }
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

function removeThisAndDoRenames(node: TS.Node, renames: Map<string, string>): string {
  return mapPropertyAccesses(node, (propertyName, target) => {
    if (target === 'this') {
      return renames.get(propertyName) ?? propertyName;
    }
  });
}

function isTruthy<T>(x: T): x is Exclude<T, 0 | false | null | undefined | typeof NaN | ''> {
  return !!x;
}
