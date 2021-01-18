#!/bin/bash

set -e

# Run applicable unit tests
files=$( git status -s | awk '{ print $2 }' )
if [ -z "$files" ]; then
  echo "Error: No staged files"
  exit 1
fi
yarn test:unit --findRelatedTests $files --passWithNoTests

# Run integration tests
yarn test:integration
