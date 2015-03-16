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

/**
 * @file Smooths raw, timestamped distances.
 */

import _ from 'lodash';

import {padToSymmetry} from './padder';
import {
  findFirstIndexAfterWindow,
  findFirstIndexWithinWindow,
  calculateTimeSinceReferenceInSeconds
} from './util';

/**
 * Limit a value onto the interval [min, max].
 */
const forceBetween = (min, max, value) => Math.max(min, Math.min(max, value));

/**
 * Calculates a weighted average for the distance value at index. The weight is
 * inversely proportional to the temporal proximity to timestamp at index,
 * divided by 0.5 * windowInSeconds.
 */
const calculateWeightedAverage = (windowInSeconds, index, distances,
                                  timestamps) => {
  const timeDifferences = calculateTimeSinceReferenceInSeconds(timestamps,
                                                               index);

  const padded = padToSymmetry(index, distances, timeDifferences);
  const paddedDistances = padded.distances;
  const paddedTimeDifferences = padded.timeDifferences;
  const paddedLen = _.size(paddedDistances);

  const halfWindowCoeff = 2 / windowInSeconds;
  const clamp = _.partial(forceBetween, 0, 1);
  let sum = 0;
  let divisor = 0;
  for (let i = 0, coeff; i < paddedLen; ++i) {
    coeff = clamp(1 - halfWindowCoeff * Math.abs(paddedTimeDifferences[i]));
    divisor += coeff;
    sum += coeff * paddedDistances[i];
  }
  return sum / divisor;
};

/**
 * Inserts the given distance and timestamp into copies of the distances and
 * timestamps arrays while maintaining chronologically increasing order. Returns
 * the copies.
 *
 * @param distances {Number[]} An array of distances. Must not be null or
 *   undefined.
 * @param timestamps {Date[]} An array of timestamps. Must not be null or
 *   undefined. Each element corresponds with an element in distances. Must have
 *   the same length as distances. timestamps is expected to be in
 *   chronologically increasing order.
 * @param distance {Number} A distance value to add into distances.
 * @param timestamp {Date} A timestamp value to add into timestamps. distance
 *   and timestamp are inserted so that timestamps retains chronologically
 *   increasing order.
 * @returns {Object} An object containing keys 'distances' and 'timestamps'.
 */
const insertInOrder = (distances, timestamps, distance, timestamp) => {
  let newDistances = _.clone(distances);
  let newTimestamps = _.clone(timestamps);
  let insertionIndex = Infinity;
  if (_.size(newDistances) > 0 && timestamp < _.last(newTimestamps)) {
    insertionIndex = _.sortedIndex(newTimestamps, timestamp);
  }
  newDistances.splice(insertionIndex, 0, distance);
  newTimestamps.splice(insertionIndex, 0, timestamp);
  return {
    'distances': newDistances,
    'timestamps': newTimestamps
  };
};

/**
 * Given a time window for smoothing, return a function to do the smoothing.
 * @param {Number} windowInSeconds The time window within which values will be
 *   smoothed.
 * @returns {function} @see smooth
 */
const createSmoother = (windowInSeconds) => {
  if (!_.isNumber(windowInSeconds) || _.isNaN(windowInSeconds) ||
      windowInSeconds < 0) {
    throw new Error('windowInSeconds must be a positive Number.');
  }

  let distances = [];
  let timestamps = [];
  let currentFocusIndex = 0;

  const averager = _.partial(calculateWeightedAverage, windowInSeconds);
  const findFirstWithin = _.partial(findFirstIndexWithinWindow,
                                    windowInSeconds);
  const findFirstAfter = _.partial(findFirstIndexAfterWindow, windowInSeconds);

  /**
   * Collects a distance value and its timestamp. Returns smoothed distance
   * values with corresponding timestamp values. Values are returned only if the
   * given timestamp is late enough so that it is outside of the smoothing
   * window centred on any previous, unsmoothed (distance, timestamp) pair.
   *
   * Smoothing is done with a weighted average smoother that uses temporal
   * proximity for weighting.
   *
   * @param timestamp {Date} Timestamp should, but does not have to, have a
   *   higher value than any previously given timestamp. If it does not, then
   *   the previously returned smoothed distances may be incorrect as they do
   *   not contain the effect of the given distance.
   */
  const smooth = (distance, timestamp) => {
    if (!_.isNumber(distance) || _.isNaN(distance) || distance < 0) {
      throw new Error('distance must be a non-negative Number and not NaN.');
    }
    if (!_.isDate(timestamp)) {
      throw new Error('timestamp must be a Date.');
    }

    const inserted = insertInOrder(distances, timestamps, distance, timestamp);
    distances = inserted.distances;
    timestamps = inserted.timestamps;

    let smoothed = [];
    if (_.size(distances) > 1) {
      const outsideIndex = findFirstWithin(timestamps, timestamp);
      const smoothableIndexArray = _.range(currentFocusIndex, outsideIndex);
      const len = _.size(smoothableIndexArray);
      if (len > 0) {
        // It is probably faster in practice to select a single interval of
        // distances than to select an interval of distances for each distance
        // to be smoothed.
        const firstIndex =
          findFirstWithin(timestamps,
                          timestamps[_.first(smoothableIndexArray)]);
        const lastIndex =
          findFirstAfter(timestamps, timestamps[_.last(smoothableIndexArray)]);
        const distancesWithin = _.slice(distances, firstIndex, lastIndex);
        const timestampsWithin = _.slice(timestamps, firstIndex, lastIndex);
        const firstFocusIndexWithin = currentFocusIndex - firstIndex;
        for (let i = 0; i < len; ++i) {
          let index = firstFocusIndexWithin + i;
          let smoothedDistance = averager(index, distancesWithin,
                                          timestampsWithin);
          smoothed.push({
            'distance': smoothedDistance,
            'timestamp': timestampsWithin[index]
          });
        }
        currentFocusIndex += len;
      }
    }
    return smoothed;
  };

  return smooth;
};

export {createSmoother};
