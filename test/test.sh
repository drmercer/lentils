#!/bin/bash

set -e

if [[ $PWD == */lentils ]]; then
	cd ./test
fi
if [[ $PWD != */lentils/test ]]; then
	echo "Error: must be in /lentils/test"
	exit 123
fi

# Test Node
yarn ts:cjs
node ../cjs/test/node/index.js

# Test Deno
cd ../deno/
deno run --unstable --allow-read=.. --allow-write=. ./denoify.unstable.ts
cd ../test/
maybe_import_map=""
if [ -z "$LENTILS_USE_ESM_SH_IMPORTS" ]; then
  # we use an import map to test the "denoified" resources as they exist locally, rather than testing
  # the resources built on esm.sh (which might be outdated if there are unpublished changes)
  maybe_import_map="--import-map ../deno/denoified-lentils-import-map.json"
fi
deno test $maybe_import_map --reload deno/

echo "All tests passed. :)"
