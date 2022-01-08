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
deno test deno/

echo "All tests passed. :)"
