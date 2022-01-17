# Lentils 🥘

A miscellaneous hodge-podge of TypeScript utilities. Designed to be usable in source form (the build step happens in the dependent projects, not in this one).

As published on npm, this package includes two versions of each file - ES modules and CommonJS. For example, `common/types/checks.ts` gets published both as `@drmercer/lentils/cjs/common/types/checks` (CommonJS) and as `@drmercer/lentils/esm/common/types/checks` (ES module). This is because ES modules are more modern and provide smaller bundles with tools like Webpack (in my experience), while CommonJS modules are more broadly compatible.

# Using in Deno

To use these utilities in Deno, I recommend using [esm.sh](https://esm.sh) to compile them into ES modules with Deno typings headers included. You'll have to use the CommonJS version of the files, because esm.sh doesn't properly compile the ES module kind for some reason. (It's probably because the `package.json` doesn't have `"type": "module"`, for CommonJS Node compatibility).

```ts
import { isNonNull } from 'https://esm.sh/@drmercer/lentils/cjs/common/types/checks.js';
```

# Using in Node

To use these utilities in Node, just add them to your project:

```
yarn add @drmercer/lentils
```

and then import the CommonJS files like so:

```ts
const { isNonNull } = require('@drmercer/lentils/cjs/common/types/checks');
// OR, if you're using TS, you can probably do this:
import { isNonNull } from '@drmercer/lentils/cjs/common/types/checks';
```

# Using in the browser via Webpack (and probably other bundlers)

In Webpack, you can import the `esm/` version of the file you need, to get smaller output builds. The `cjs/` files should also work just fine, if you prefer.

```ts
import { isNonNull } from '@drmercer/lentils/esm/common/types/checks';
```

If you want to write code that can be used in both Node and the browser while preserving the Webpack benefits of ES modules, you can probably use Webpack's `alias` feature to convert `cjs/` imports to `esm/` imports at compile time.

# Using in the browser directly

You can probably use esm.sh for direct ES module usage in the browser, just like in Deno. You also could try using the `esm/` version via a CDN like [unpkg](https://unpkg.com/), which doesn't do compiling like esm.sh does.

```
import { isNonNull } from 'https://esm.sh/@drmercer/lentils/cjs/common/types/checks.js';
```
