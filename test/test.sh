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
npx tsc -b node/tsconfig.json && node node/index.js

# Test Deno
cd ../deno/
deno run --unstable --allow-read=.. --allow-write=. ./denoify.unstable.ts
cd ../test/
deno test deno/

code=$?

if [ $code == 0 ]; then
  echo "Test passed with status code $code. :)"
else
  echo "Test failed with status code $code. :("
fi
exit $code
