import { isNonNull } from '../denoified-common/types/checks.ts';

import ts from './typescript.ts';
import type { ts as TS } from './typescript.ts';

// console.log(ts.createSourceFile("foo.ts", "const foo = 1;", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS).statements[0])
// console.log(ts.factory.createVariableStatement([],
//   ts.factory.createVariableDeclarationList([
//     ts.factory.createVariableDeclaration("foo"),
//   ], ts.NodeFlags.Const)
// ));
// Deno.exit();

const file = Deno.args[0];

const source = await Deno.readTextFile(file);

const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
// console.log(Deno.inspect(sourceFile, {
//   colors: true,
//   depth: 10,
// }));

const updatedStatements = sourceFile.statements.map((statement): ([TS.Statement, TS.Statement[]] | undefined) => {
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
  return undefined; // means no change
});

// Write results out to file

const resultFile = ts.createSourceFile(file, "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

const results = updatedStatements
  .filter(isNonNull)
  .map(([oldStatement, newStatements]) => {
    const newStatementSource = newStatements
      .map(s => {
        return printer.printNode(ts.EmitHint.Unspecified, s, resultFile);
      })
      .join("\n\n");
    return [oldStatement.pos, oldStatement.end, newStatementSource] as const;
  })
  .reduce((src, [start, end, replacement]) => {
    // Find the first non-comment line after start
    const realStart = start + src.substr(start).search(/^ *[^\s\/]/m);
    return src.substring(0, realStart) + replacement + src.substring(end);
  }, source);
console.log(results);

function injectableClassToInjectableFunction(statement: TS.ClassDeclaration): TS.Statement[] {
  const className = statement.name!.escapedText.toString();
  return [
    ts.factory.createTypeAliasDeclaration(
      undefined,
      [ ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
      className,
      undefined,
      ts.factory.createTypeReferenceNode(
        "InjectedValue",
        [
          ts.factory.createTypeQueryNode(
            ts.factory.createIdentifier(className),
          ),
        ],
      )
    ),
    constDeclaration(
      className,
      undefined, // explicit type
      ts.factory.createCallExpression(
        ts.factory.createIdentifier("injectable"),
        undefined, // type params
        [
          ts.factory.createStringLiteral(className, true),
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [
              ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                undefined, "inject",
              ),
            ],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createBlock(injectableClassMembersToStatements(statement.members), true),
          ),
        ],
      ),
      true, // exported const
    ),
  ];
}

function injectableClassMembersToStatements(members: readonly TS.ClassElement[]): TS.Statement[] {
  const exported: string[] = [];
  const ctor = members.find(m => ts.isConstructorDeclaration(m)) as TS.ConstructorDeclaration;
  let injections: TS.Statement[];
  if (ctor) {
    const params = ctor.parameters.map(p => {
      const name: string = ts.isIdentifier(p.name) ? p.name.escapedText.toString() : p.name.toString();
      const typeName: string = p.type && ts.isTypeReferenceNode(p.type) && ts.isIdentifier(p.type.typeName) && p.type.typeName.escapedText.toString() || "null as any";
      const isPublic = p.modifiers?.some(m => m.kind === ts.SyntaxKind.PublicKeyword) ?? false;
      return {name, typeName, isPublic};
    });
    injections = params.map(({name, typeName}) => {
      return constDeclaration(
        name,
        undefined,
        ts.factory.createCallExpression(
          ts.factory.createIdentifier("inject"),
          undefined,
          [
            ts.factory.createIdentifier(typeName),
          ],
        ),
      );
    });
    const exportedParams = params.filter(({isPublic}) => isPublic).map(({name}) => name);
    exported.push(...exportedParams);
  } else {
    injections = [];
  }
  const transformedMembers: TS.Statement[] = members.flatMap<TS.Statement>(m => {
    if (ts.isConstructorDeclaration(m)) {
      return Array.from(m.body?.statements ?? []).map(s => removeThis<TS.Statement>(s));
    }
    const name: string = !m.name ? "" : ts.isIdentifier(m.name) ? m.name.escapedText.toString() : m.name.toString();
    const isPublic: boolean = !m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.PrivateKeyword);
    if (name && isPublic) {
      exported.push(name);
    }
    if (ts.isPropertyDeclaration(m)) {
      // Known bug: non-readonly exported properties are not properly exposed
      const isReadonly = isPublic || (m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ReadonlyKeyword) ?? false);
      return [
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                name,
                undefined,
                m.type,
                m.initializer && removeThis<TS.Expression>(m.initializer)),
            ],
            isReadonly ? ts.NodeFlags.Const : ts.NodeFlags.Let,
          )
        ),
      ];
    } else if (ts.isMethodDeclaration(m)) {
      const allowedModifiers = [ts.SyntaxKind.AsyncKeyword];
      return [
        ts.factory.createFunctionDeclaration(
          undefined,
          m.modifiers?.filter(mod => allowedModifiers.includes(mod.kind)),
          m.asteriskToken,
          name,
          m.typeParameters,
          m.parameters,
          m.type,
          ts.factory.createBlock(
            Array.from(m.body?.statements ?? []).map(s => removeThis<TS.Statement>(s)),
            true,
          ),
        ),
      ];
    } else {
      console.warn("Unrecognized member kind: ", m.kind);
      return [];
    }
  });
  return [
    ...injections,
    ...transformedMembers,
    ts.factory.createReturnStatement(
      ts.factory.createObjectLiteralExpression(exported.map(name => {
        return ts.factory.createShorthandPropertyAssignment(name);
      }), true),
    ),
  ];
}

function removeThis<T extends TS.Statement | TS.Expression>(statement: T): T {
  // TODO
  return statement;
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
