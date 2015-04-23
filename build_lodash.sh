#!/bin/sh
#
# Build a custom lodash to reduce size.

PACKAGE_VERSION="`npm list --depth=0 lodash-cli | grep lodash-cli | sed 's/.*@\([[:digit:]][[:digit:]]*\.[[:digit:]][[:digit:]]*\.[[:digit:]][[:digit:]]*\).*$/\1/'`"
LODASH='./node_modules/.bin/lodash'
BUILD_DIR='./lodash_custom'
OUTPUT_BASENAME='lodash.js'
PACKAGE_JSON="${BUILD_DIR}/package.json"
OUTPUT="${BUILD_DIR}/${OUTPUT_BASENAME}"

mkdir -p "${BUILD_DIR}" && \
printf '%s\n' \
  '{' \
  '  "name": "lodash",' \
  "  \"version\": \"${PACKAGE_VERSION}\"," \
  "  \"main\": \"${OUTPUT_BASENAME}\"," \
  '  "private": true' \
  '}' \
  > "${PACKAGE_JSON}" && \
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
