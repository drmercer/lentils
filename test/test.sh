#!/bin/bash

if [ $PWD == */lentils/test ]; then
	echo "Error: must be in /lentils/test"
	exit 123
fi

# Link to lentils and install
cd ../ &&
yarn link &&
cd ./test &&
yarn link lentils &&
yarn &&

# Test Node
yarn test:node &&

# Test Deno
yarn test:deno

code=$?

cd ../ &&
yarn unlink

if [ $code == 0 ]; then
  echo "Test passed with status code $code. :)"
else
  echo "Test failed with status code $code. :("
fi
exit $code
