#!/bin/bash

# Run applicable unit tests
files=$( git diff --staged --name-only )
if [ -z "$files" ]; then
  echo "Error: No staged files"
  exit 1
fi
yarn test:unit --findRelatedTests $files --passWithNoTests

# Run integration tests
yarn test:integration
