#!/bin/sh
#
# Build a custom lodash to reduce size.

PACKAGE_VERSION="`npm list --depth=0 lodash-cli | grep lodash-cli | sed 's/.*@\([[:digit:]][[:digit:]]*\.[[:digit:]][[:digit:]]*\.[[:digit:]][[:digit:]]*\).*$/\1/'`"
LODASH='node_modules/.bin/lodash'
BUILD_DIR='./lodash_custom'
PACKAGE_JSON="${BUILD_DIR}/package.json"
OUTPUT="${BUILD_DIR}/lodash.min.js"

sed -i "s/\"version\": \".*\"/\"version\": \"${PACKAGE_VERSION}\"/" "${PACKAGE_JSON}" && \
"${LODASH}" modern -o "${OUTPUT}" -p \
exports=node \
include=\
at,\
chain,\
clone,\
cloneDeep,\
constant,\
every,\
filter,\
findLastIndex,\
first,\
flatten,\
forEach,\
initial,\
isArray,\
isBoolean,\
isDate,\
isEmpty,\
isFinite,\
isNaN,\
isNumber,\
isString,\
last,\
map,\
partial,\
pick,\
property,\
range,\
reject,\
rest,\
size,\
slice,\
some,\
sortedIndex,\
spread,\
takeWhile,\
times,\
zip
