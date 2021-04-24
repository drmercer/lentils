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

  const component = sourceFile.statements.find(statement => {
    return statement.decorators?.find(node => {
      return node.getText().includes("@Component");
    });
  }) as TS.ClassDeclaration;

  if (!component) {
    throw new Error("Could not find a @Component class!");
  }
  const name = component.name?.escapedText ?? "<unnamed>";
  console.log(`Found @Component class ${name}`);

  const componentDecorator = component.decorators!.find(node => {
    return node.getText().includes("@Component");
  })!;
  const transformedComponent: string = transformComponent(component, componentDecorator);

  return transformChildren(sourceFile, (statement: TS.Node) => {
    if (statement === component) {
      return transformedComponent;
    } else if (ts.isImportDeclaration(statement)) {
      if (/vue-property-decorator|vue-class-component/.test(statement.getText())) {
        const imports: string[] = [
          'defineComponent',
          /\bcomputed\(/.test(transformedComponent) ? 'computed' : undefined,
          /\bRef</.test(transformedComponent) ? 'Ref' : undefined,
          /\bref\(/.test(transformedComponent) ? 'ref' : undefined,
        ].filter(isNonNull).sort();
        return `import { ${imports.join(', ')} } from '@vue/composition-api';`;
      }
    }
  }).replaceAll(/ +$/gm, '') // trim trailing spaces
}

function transformComponent(component: TS.ClassDeclaration, decorator: TS.Decorator): string {
  const options: string = ts.isCallExpression(decorator.expression) ? decorator.expression.arguments[0].getText() : `{
}`;
  const props = findProps(component.members);
  const propsText = !props.length ? '' : `\n  props: {\n${
    props
      .map(p => {
        const options = [
          p.default && 'default: ' + p.default,
          p.required && 'required: ' + p.required,
          p.runtimeType && 'type: ' + p.runtimeType,
        ].filter(isNonNull).map(s => '      ' + s + ',\n').join('');
        return `    ${p.name}: {\n${options}    },`;
      })
      .join('\n')    }\n  },`
  const newOptions = options.replace(/\s*}\s*$/, `${propsText}\n  setup(props, {emit}) {
    ${classMembersToStatements(component.members, props).replaceAll(/\n/g, '\n    ')}
  },
}`)
  // NOTE: assumes that the @Component class was the default export
  return `export default defineComponent(${newOptions});`;
}

interface Prop {
  node: TS.PropertyDeclaration;
  name: string;
  type?: string;
  runtimeType?: string;
  required?: string;
  default?: string;
}

function findProps(members: readonly TS.ClassElement[]): Prop[] {
  return members
    .map<Prop|undefined>(m => {
      if (ts.isPropertyDeclaration(m)) {
        const propDecorator = m.decorators?.find(d => d.getText().startsWith("@Prop"));
        if (propDecorator && ts.isCallExpression(propDecorator.expression)) {
          const type = m.type!.getText();
          const name: string = !m.name ? "" : ts.isIdentifier(m.name) ? m.name.escapedText.toString() : m.name.toString();
          const options = propDecorator.expression.arguments[0];
          const parsedOptions = (options && ts.isObjectLiteralExpression(options)) ? parseOptions(options) : {required: undefined, default: undefined};
          return {
            node: m,
            name,
            type,
            runtimeType: runtimeType(type),
            ...parsedOptions,
          };
        }
      }
    })
    .filter(isNonNull);
}

function parseOptions(options: TS.ObjectLiteralExpression) {
  function getProperty(name: string): string|undefined {
    return options.properties.filter(ts.isPropertyAssignment).find(p => p.name && ts.isIdentifier(p.name) && p.name.text === name)?.initializer.getText();
  }
  return {
    required: getProperty("required"),
    default: getProperty("default"),
  };
}

function runtimeType(type: string): string|undefined {
  if (type === 'string') {
    return 'String';
  } else if (type === 'number') {
    return 'Number';
  } else if (type === 'boolean') {
    return 'Boolean';
  } else if (type === 'symbol') {
    return 'Symbol';
  } else if (type === 'any' || type === 'unknown') {
    return undefined;
  } else if (/^\(.*\)\s*=>\s*.*/.test(type)) { // function
    return `Function as () => (${type})`;
  } else if (/^[A-Z]\w*$/.test(type)) { // custom class
    return type.substr(0, 1).toUpperCase() + type.substr(1);
  } else if (/\[\]$/.test(type)) { // array
    return `Array as () => ${type}`;
  } else if (/^['"]/.test(type)) { // string literal
    return `String as () => ${type}`;
  } else {  // fallback: compile-time checking only
    return `undefined as unknown as () => ${type}`;
  }
}

interface Declaration {
  member: TS.ClassElement;
  name: string;
  renamedName?: string;
}

function classMembersToStatements(members: readonly TS.ClassElement[], props: Prop[]): string {
  // TODO support getters/setters
  // TODO apply route hack automagically
  // TODO only include setup params that are actually used
  // TODO import dmInject automagically, and remove DmInject import
  // TODO convert lifecycle hooks / router hooks appropriately
  // TODO correctly demargin multiline ref values
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
        const prop = props.find(p => p.node === m);
        if (prop) {
          const {type, name} = prop;
          return `${comment}const ${newDeclarationName}${type ? ': Ref<' + type + '>' : ''} = computed(() => props.${name});`;
        } else if (m.decorators?.find(d => d.getText().startsWith("@DmInject"))) {
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
