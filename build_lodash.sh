#!/bin/sh
#
# Build a custom lodash to reduce size.

OUTPUT='lodash_build/lodash.min.js'
LODASH='node_modules/.bin/lodash'

"${LODASH}" -o "${OUTPUT}" -p \
exports=none \
include=\
at,\
cloneDeep,\
every,\
filter,\
first,\
flatten,\
forEach,\
isArray,\
isDate,\
isEmpty,\
isNumber,\
last,\
map,\
partial,\
property,\
range,\
reject,\
size,\
slice,\
takeWhile,\
zip

# FIXME: Automatically sed the version in package.json from lodash-cli.
