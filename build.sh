#!/usr/bin/env bash

cd $(dirname "$0") &&
rm -rf dist &&
mkdir dist &&
tsc

UGLIFY=$(which uglifyjs);

if [[ -z "${UGLIFY}" ]]; then
   npm install -g uglify-js
fi

uglifyjs --compress -o dist/blt.min.js dist/blt.js