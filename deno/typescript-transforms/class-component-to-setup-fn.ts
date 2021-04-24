import { isNonNull } from '../denoified-common/types/checks.ts';
import ts from './typescript.ts';
import type { ts as TS } from './typescript.ts';
import { getBoundNames, mapPropertyAccesses, nodesText, parse, returnedObject, transformAll, transformChildren } from "./util.ts";
import { demargin } from "../denoified-common/string/string.ts";

if (import.meta.main) {
  console.log("Running...");

  const file = Deno.args[0];

  const source = await Deno.readTextFile(file);

  const transformed = transform(source);

  await Deno.writeTextFile(file, transformed);

  console.log("Done");
}

export function transform(source: string): string {
  return source.replace(/^<script.*?>\n(.*)^<\/script>$/ms, (tsSource) => {
    return transformTs(tsSource);
  });
}

export function transformTs(source: string): string {
  const sourceFile = parse(source);

  return transformChildren(sourceFile, (statement: TS.Node) => {
    if (ts.isClassDeclaration(statement) && statement.decorators) {
      const name = statement.name?.escapedText ?? "<unnamed>";
      console.log(`Found class ${name}`);
      const componentDecorator = statement.decorators.find(node => {
        return node.getText().includes("@Component");
      });
      if (componentDecorator) {
        const name = statement.name?.escapedText ?? "<unnamed>";
        console.log(`Found @Component class ${name}`);
        return transformComponent(statement, componentDecorator);
      }
    } else if (ts.isImportDeclaration(statement)) {
      if (/vue-property-decorator|vue-class-component/.test(statement.getText())) {
        return `import { defineComponent, ref, Ref, computed } from '@vue/composition-api';`;
      }
    }
  }).replaceAll(/ +$/gm, '') // trim trailing spaces
}

function transformComponent(component: TS.ClassDeclaration, decorator: TS.Decorator): string {
  const options: string = ts.isCallExpression(decorator.expression) ? decorator.expression.arguments[0].getText() : `{
}`;
  const newOptions = options.replace(/\s*}\s*$/, `\n  setup(props, {emit}) {
    ${classMembersToStatements(component.members).replaceAll(/\n/g, '\n    ')}
  },
}`)
  // NOTE: assumes that the @Component class was the default export
  return `export default defineComponent(${newOptions});`;
}

interface Declaration {
  member: TS.ClassElement;
  name: string;
  renamedName?: string;
}

function classMembersToStatements(members: readonly TS.ClassElement[]): string {
  const alreadyUsedNames = new Set<string>();
  members.forEach(m => getBoundNames(m, alreadyUsedNames));

  const declarations: Declaration[] = members
    .map<Declaration|undefined>(m => {
      const name: string = !m.name ? "" : ts.isIdentifier(m.name) ? m.name.escapedText.toString() : m.name.toString();
      let renamedName: string | undefined = undefined;
      while (alreadyUsedNames.has(renamedName || name)) {
        // need to rename
        renamedName = '$' + (renamedName || name);
      }
      return {
        member: m,
        name,
        renamedName,
      };
    })
    .filter(isNonNull);

  const renames = new Map<string, string>(
    declarations
      .filter(d => !!d.renamedName)
      .map(({ name, renamedName }) => [name, renamedName!]),
  );
  renames.set('$emit', 'emit');

  const statements = declarations
    .map(({member: m, name, renamedName}) => {
      const newDeclarationName = renamedName || name;
      const comment = demargin(m.getSourceFile().text.substr(m.getFullStart(), m.getLeadingTriviaWidth()));
      if (ts.isPropertyDeclaration(m)) {
        const isInjectable = m.decorators?.find(d => d.getText().startsWith("@DmInject"));
        if (isInjectable) {
          const type = m.type!.getText();
          return `${comment}const ${newDeclarationName} = dmInject(${type});`;
        } else {
          // Convert to Ref
          const initializer = m.initializer?.getText();
          const type = m.type?.getText();
          renames.set(name, newDeclarationName + '.value'); // TODO ew, don't mutate renames, do it a better way
          return `${comment}const ${newDeclarationName}${type ? ': Ref<' + type + '>' : ''}${initializer ? ' = ref(' + initializer + ')' : ''};`;
        }
      } else if (ts.isMethodDeclaration(m)) {
        const async: boolean = m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
        const typeParams = m.typeParameters ? `<${nodesText(m.typeParameters)}>` : '';
        const params = m.parameters ? nodesText(m.parameters) : '';
        const body = demargin(transformAll(m.body?.statements ?? [], (n) => removeThisAndDoRenames(n, renames)))
          .trim()
          .split('\n')
          .join('\n  ');
        return `
${comment}${async ? 'async ' : ''}function ${newDeclarationName}${typeParams}(${params}) {
  ${body}
}`.trim();
      } else {
        console.warn("Unrecognized member kind: ", m.kind);
        return '';
      }
    });

  // Export all declarations, because we can't tell what's used in the template and what's not (at least not without parsing the template)
  const exports = declarations.map(d => {
    return d.name + (d.renamedName ? ': ' + d.renamedName : '');
  });

  return [
    ...statements,
    returnedObject(exports),
  ].join('\n\n');
}

function removeThisAndDoRenames(node: TS.Node, renames: Map<string, string>): string {
  return mapPropertyAccesses(node, (propertyName, target) => {
    if (target === 'this') {
      return renames.get(propertyName) ?? propertyName;
    }
  });
}
