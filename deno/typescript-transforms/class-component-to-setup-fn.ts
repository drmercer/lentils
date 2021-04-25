import { isNonNull } from '../denoified-common/types/checks.ts';
import ts from './typescript.ts';
import type { ts as TS } from './typescript.ts';
import { getBoundNames, mapPropertyAccesses, nodesText, parse, returnedObject, transformAll, transformChildren } from "./util.ts";

/** Vue 2 lifecycle hooks */
const lifecycleHooks: readonly string[] = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'activated',
  'beforeDestroy',
  'destroyed',
];

if (import.meta.main) {
  console.log("Running...");

  const file = Deno.args[0];

  const source = await Deno.readTextFile(file);

  const transformed = transform(source);

  await Deno.writeTextFile(file, transformed);

  console.log("Done");
}

export function transform(source: string): string {
  const template = source.match(/^<template.*?>\n(.*)^<\/template>$/ms)![1];
  const wordsInTemplate = new Set<string>(
    [...template.matchAll(/\b[$\w]+\b/g)].map(m => m[0])
  );
  return source.replace(/^<script.*?>\n(.*)^<\/script>$/ms, (tsSource) => {
    return transformTs(tsSource, wordsInTemplate);
  });
}

export function transformTs(source: string, wordsInTemplate: Set<string>): string {
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
  const transformedComponent: string = transformComponent(component, componentDecorator, wordsInTemplate);

  return transformChildren(sourceFile, (statement: TS.Node) => {
    if (statement === component) {
      return transformedComponent;
    } else if (ts.isImportDeclaration(statement)) {
      const importText = statement.getText();
      if (/vue-property-decorator|vue-class-component/.test(importText)) {
        const imports: string[] = [
          'defineComponent',
          'computed',
          'Ref',
          'ref',
          'watch',
          'nextTick',
          ...lifecycleHooks.map(hook => 'on' + capitalize(hook)),
        ].filter(isNonNull)
          .filter(name => new RegExp('\\b' + name + '\\b').test(transformedComponent))
          .sort();
        return `import { ${imports.join(', ')} } from '@vue/composition-api';`;
      } else if (/\bDmInject\b/.test(importText)) {
        return importText.replace('DmInject', 'dmInject').replace('vue-injector', 'composables/injector');
      }
    }
  }).replaceAll(/ +$/gm, '') // trim trailing spaces
}

function transformComponent(component: TS.ClassDeclaration, decorator: TS.Decorator, wordsInTemplate: Set<string>): string {
  const options: string = ts.isCallExpression(decorator.expression) ? decorator.expression.arguments[0].getText() : `{
}`;
  const props = findProps(component.members);
  const propsText = buildPropText(props);
  console.warn('[ ] Check if any parameters to setup() are unused');
  const newOptions = options.replace(/\s*}\s*$/, `${propsText}\n  setup(props, {emit}) {
    ${classMembersToStatements(component.members, props, wordsInTemplate).trim().replaceAll(/\n/g, '\n    ')}
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

function buildPropText(props: Prop[]): string {
  if (!props.length) {
    return '';
  }
  const propsText = props
    .map(p => {
      const options = [
        p.default && 'default: ' + p.default,
        p.required && 'required: ' + p.required,
        p.runtimeType && 'type: ' + p.runtimeType,
      ].filter(isNonNull).map(s => s + ',').join('\n');
      return `
${p.name}: {
  ${indent(options, 1)}
},
`.trim();;
    })
    .join('\n');
  return `
  props: {
    ${indent(propsText, 2)}
  },`
}

function parseOptions(options: TS.ObjectLiteralExpression): Record<string, string> {
  return options.properties
    .filter(ts.isPropertyAssignment)
    .reduce((acc, p) => {
      if (p.name && ts.isIdentifier(p.name)) {
        return {
          ...acc,
          [p.name.text]: p.initializer.getText()
        };
      }
      return acc;
    }, {});
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
    return type;
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

function classMembersToStatements(members: readonly TS.ClassElement[], props: Prop[], wordsInTemplate: Set<string>): string {
  // TODO only include setup params that are actually used
  // TODO convert router hooks appropriately?
  const alreadyUsedNames = new Set<string>();
  members.forEach(m => getBoundNames(m, alreadyUsedNames));

  const setters = new Map<string, TS.SetAccessorDeclaration>();
  members.forEach(m => {
    if (ts.isSetAccessorDeclaration(m)) {
      const name = getClassMemberName(m);
      setters.set(name, m);
    }
  });

  const declarations: Declaration[] = members
    .map<Declaration|undefined>(m => {
      if (ts.isSetAccessorDeclaration(m)) {
        // setters are combined with getters so we skip them here
        return undefined;
      }
      const name: string = getClassMemberName(m);
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
  renames.set('$nextTick', 'nextTick');

  const statements = declarations
    .map<string|undefined>(({member, name}) => {
      const leadingTrivia = member.getSourceFile().text.substr(member.getFullStart(), member.getLeadingTriviaWidth());
      const comment = demarginExceptFirstLine(leadingTrivia);
      const statement = memberToStatement(member, name, renames, props, setters);
      if (statement) {
        return comment + statement;
      } else {
        return undefined;
      }
    })
    .filter(isNonNull)

  const exports = declarations
    .filter(d => {
      return !(ts.isMethodDeclaration(d.member) && isLifecycleHook(getClassMemberName(d.member)));
    })
    .map(d => {
      return d.name + (d.renamedName ? ': ' + d.renamedName : '');
    })
    .filter(name => {
      return wordsInTemplate.has(name);
    })
    .filter(name => {
      // Don't re-export props. Vue gives a warning if you do that.
      return !props.find(p => p.name === name);
    })

  return [
    ...statements,
    '\n\n',
    returnedObject(exports),
  ].join('');
}

function getClassMemberName(m: TS.ClassElement): string {
  return !m.name ? "" : ts.isIdentifier(m.name) ? m.name.escapedText.toString() : m.name.toString();
}

function memberToStatement(
  m: TS.ClassElement,
  name: string,
  renames: Map<string, string>,
  props: Prop[],
  setters: Map<string, TS.SetAccessorDeclaration>,
): string|undefined {
  const newDeclarationName = renames.get(name) || name;
  if (ts.isPropertyDeclaration(m)) {
    const prop = props.find(p => p.node === m);
    if (prop) {
      const { type, name } = prop;
      renames.set(name, newDeclarationName + '.value'); // TODO ew, don't mutate renames, do it a better way
      return `const ${newDeclarationName}${type ? ': Ref<' + type + '>' : ''} = computed(() => props.${name});`;
    } else if (m.decorators?.find(d => d.getText().startsWith("@DmInject"))) {
      const type = m.type!.getText();
      return `const ${newDeclarationName} = dmInject(${type});`;
    } else {
      // Convert to Ref
      const initializer = m.initializer?.getText();
      const type = m.type?.getText();
      renames.set(name, newDeclarationName + '.value'); // TODO ew, don't mutate renames, do it a better way
      return `const ${newDeclarationName}${type ? ': Ref<' + type + '>' : ''} = ref(${initializer ? demarginExceptFirstLine(initializer) : type ? 'null!' : 'null as any'});`;
    }
  } else if (ts.isMethodDeclaration(m)) {
    const body = transformBody(m.body, renames);
    const async: boolean = m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
    if (isLifecycleHook(name)) {
      return lifecycleHookDeclaration(name, async, body);
    } else {
      if (isRouterHook(name)) {
        console.warn('[ ] Migrate ' + name + ' hook manually');
      }
      const typeParams = m.typeParameters ? `<${nodesText(m.typeParameters)}>` : '';
      const params = m.parameters ? nodesText(m.parameters) : '';
      const watchDecorator = m.decorators?.find(node => {
        return node.getText().includes("@Watch");
      });
      const extraStatementsForWatching = watchDecorator ? buildWatchStatements(watchDecorator, newDeclarationName) : undefined;
      return functionDeclaration(newDeclarationName, params, typeParams, async, body) +
        (extraStatementsForWatching ? '\n' + extraStatementsForWatching : '');
    }

  } else if (ts.isGetAccessorDeclaration(m)) {
    const type = m.type?.getText();
    const body = transformBody(m.body, renames);
    renames.set(name, newDeclarationName + '.value'); // TODO ew, don't mutate renames, do it a better way

    // get setter info
    const setter = setters.get(name);
    const setterBody = setter ? transformBody(setter?.body, renames) : undefined;
    const setterArg = setter?.parameters?.[0]?.getText();

    return getterDeclaration(newDeclarationName, body, type, setterBody, setterArg);
  } else {
    console.warn("Unrecognized member kind: ", m.kind);
    return undefined;
  }
}

function buildWatchStatements(decorator: TS.Decorator, functionName: string): string|undefined {
  if (decorator && ts.isCallExpression(decorator.expression)) {
    const whatToWatch = decorator.expression.arguments[0];
    const whatToWatchStr = ts.isStringLiteral(whatToWatch) ? whatToWatch.text : whatToWatch.getText();
    let statements = `watch(${whatToWatchStr}, ${functionName});`;
    console.warn(`[ ] Check that the '${statements}' statements were built correctly`);

    const options = decorator.expression.arguments[1];
    const parsedOptions = (options && ts.isObjectLiteralExpression(options)) ? parseOptions(options) : {};
    if (parsedOptions.immediate === 'true') {
      statements += `\nonMounted(${functionName});`;
    }
    return statements;
  }
  return undefined;
}

function transformBody(body: TS.FunctionBody|undefined, renames: Map<string, string>): string {
  return demargin(transformAll(body?.statements ?? [], (n) => removeThisAndDoRenames(n, renames)))
    .trim();
}

function demarginExceptFirstLine(text: string): string {
  const [firstLine, ...otherLines] = text.split('\n');
  if (!otherLines.length) {
    return text;
  }
  return firstLine + '\n' + demargin(otherLines.join('\n'));
}

function demargin(text: string): string {
  const marginSize = text
    .split('\n')
    .filter(line => !!line)
    .map(line => line.match(/^[ \t]*/)![0].length)
    .reduce((a, b) => Math.min(a,b), Number.POSITIVE_INFINITY);
  if (!Number.isFinite(marginSize)) {
    return text;
  }
  const marginRegex = new RegExp(`^[ \t]{0,${marginSize}}`, 'mg');
  return text
    .replace(marginRegex, '');
}

function indent(text: string, levels: number): string {
  const padding = Array.from({ length: levels }, () => '  ').join('');
  return text.replaceAll(/\n/g, '\n' + padding);
}

function capitalize(name: string): string {
  return name.substr(0, 1).toUpperCase() + name.substr(1);
}

function isLifecycleHook(name: string): boolean {
  return lifecycleHooks.includes(name);
}

function isRouterHook(name: string): boolean {
  return [
    'beforeRouteEnter',
    'beforeRouteLeave',
    'beforeRouteUpdate',
  ].includes(name);
}

function lifecycleHookDeclaration(hookname: string, async: boolean, body: string) {
  const hook = capitalize(hookname);
  return `
on${hook}(${async ? 'async ' : ''}() => {
  ${indent(body, 1)}
});
`.trim()
}

function functionDeclaration(name: string, params: string, typeParams: string, async: boolean, body: string) {
  return `
${async ? 'async ' : ''}function ${name}${typeParams}(${params}) {
  ${indent(body, 1)}
}
`.trim()
}

function getterDeclaration(name: string, body: string, type?: string, setterBody?: string, setterArg?: string): string {
  const arg = !setterBody ? `() => {
  ${indent(body, 1)}
}` : `{
  get: () => {
    ${indent(body, 2)}
  },
  set: (${setterArg || 'value'}) => {
    ${indent(setterBody, 2)}
  },
}`;
  return `const ${name}${type ? ': Ref<' + type + '>' : ''} = computed(${arg});`;
}

function removeThisAndDoRenames(node: TS.Node, renames: Map<string, string>): string {
  return mapPropertyAccesses(node, (propertyName, target) => {
    if (target === 'this') {
      if (propertyName.startsWith('$') && !renames.has(propertyName)) { // e.g. this.$on
        console.warn('[ ] Check if ' + propertyName + ' usages need manual migration');
      }
      return renames.get(propertyName) ?? propertyName;
    }
  });
}
