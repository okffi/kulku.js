/**
 * kulku.js - Mobility data processing
 * Copyright (C) 2015 haphut <haphut@gmail.com>
 *
 * This file is part of kulku.js.
 *
 * kulku.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * kulku.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with kulku.js.  If not, see <http://www.gnu.org/licenses/>.
 */

import _ from 'lodash';

/**
 * Returns how much the array should be padded.
 *
 * @param length {Number} The length of the array.
 * @param index {Number} The index of the array.
 * @returns padNeed {Number} The absolute value of padNeed is the amount of
 *     elements one should pad with. If the value is negative, one should
 *     prepend. If positive, append. If zero, do not pad.
 */
let calculatePadNeed = (length, index) => {
  let padNeed = 0;
  if (length > 0) {
    const mid = (length - 1) / 2;
    padNeed = Math.round(2 * (index - mid));
  }
  return padNeed;
};

let mirrorTime = (reference, timeDifferences, startIndex, endIndex) => {
  return _(timeDifferences)
         .slice(startIndex, endIndex)
         .reverse()
         .map(diff => 2 * reference - diff)
         .value();
};

let prependTimeDifferences = (timeDifferences, padNeed, index) => {
  const reference = timeDifferences[index];
  const start = 2 * index + 1;
  const end = start - padNeed;
  const toPrependTime = mirrorTime(reference, timeDifferences, start, end);
  return toPrependTime.concat(timeDifferences);
};

let appendTimeDifferences = (timeDifferences, padNeed, index) => {
  const reference = timeDifferences[index];
  const end = 2 * index - _.size(timeDifferences) + 1;
  const start = end - padNeed;
  const toAppendTime = mirrorTime(reference, timeDifferences, start, end);
  return timeDifferences.concat(toAppendTime);
};

let prependDistances = (distances, padNeed) => {
  const fillValue = _.constant(_.first(distances));
  return _.times(-padNeed, fillValue).concat(distances);
};

let appendDistances = (distances, padNeed) => {
  const fillValue = _.constant(_.last(distances));
  return distances.concat(_.times(padNeed, fillValue));
};

/**
 * Extrapolates distances and timeDifferences to have an odd number of elements
 * so that the element at the given index is in the middle.
 *
 * Copies distance values at array edges to extrapolate distances. Mirrors the
 * timestamps from the longer side.
 *
 * @param index {Number} The index for the given arrays around which symmetry
 *     will be built.
 */
let padToSymmetry = (index, distances, timeDifferences) => {
  if (!_.isArray(distances) || !_.isArray(timeDifferences)) {
    throw new Error('distances and timeDifferences must be arrays.');
  }
  const originalLength = distances.length;

  if (originalLength !== timeDifferences.length) {
    throw new Error('distances must have the same length as timeDifferences.');
  }

  let paddedIndex;
  let paddedDistances;
  let paddedTimeDifferences;

  if (originalLength > 0) {
    if (index < 0 || index >= originalLength) {
      throw new Error('index must be within bounds.');
    }

    const padNeed = calculatePadNeed(originalLength, index);

    if (padNeed < 0) { // Prepend.
      paddedIndex = index - padNeed;
      paddedTimeDifferences = prependTimeDifferences(timeDifferences, padNeed,
                                                     index);
      paddedDistances = prependDistances(distances, padNeed);
    } else { // Append.
      paddedIndex = index;
      paddedTimeDifferences = appendTimeDifferences(timeDifferences, padNeed,
                                                    index);
      paddedDistances = appendDistances(distances, padNeed);
    }
  } else {
    paddedIndex = index;
    paddedDistances = _.clone(distances);
    paddedTimeDifferences = _.clone(timeDifferences);
  }

  return {
    'index': paddedIndex,
    'distances': paddedDistances,
    'timeDifferences': paddedTimeDifferences
  };
};

export {padToSymmetry};
