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
import bezier from 'turf-bezier';
import linestring from 'turf-linestring';

import {
  calculateTimeSinceReferenceInSeconds,
  findFirstIndexAfterWindow,
  findFirstIndexWithinWindow
} from './util';

const INTERPOLATION_WINDOW_IN_SECONDS = 50;

/**
 * Add new values into storage and update the index of the minimum distance.
 * Do not modify input and return a new object.
 */
const updateStorage = (storage, smoothed) => {
  let storedSmoothed = storage.smoothed;
  let minIndex = storage.minIndex;

  const oldMinSmoothed = storedSmoothed[minIndex];
  let minSmoothedDistance = Infinity;
  if (oldMinSmoothed) {
    minSmoothedDistance = oldMinSmoothed.distance;
  }

  const length = smoothed.length;
  const oldStoredLength = storedSmoothed.length;

  for (let i = 0; i < length; ++i) {
    let smoothedDistance = smoothed[i].distance;
    if (smoothedDistance < minSmoothedDistance) {
      minSmoothedDistance = smoothedDistance;
      minIndex = oldStoredLength + i;
    }
  }
  storedSmoothed = storedSmoothed.concat(smoothed);

  return {
    'smoothed': storedSmoothed,
    minIndex
  };
};

/**
 * If the presumably global minimum has been reached, return true, false
 * otherwise.
 */
const isMinimumPassed = (storage) => {
  // FIXME: move to general config elsewhere
  const N_POINTS_AFTER_MIN = 4;
  const CLOSE_ENOUGH_IN_METERS = 50;
  const FAR_ENOUGH_IN_METERS = 2 * CLOSE_ENOUGH_IN_METERS;
  const MINIMUM_DISTANCE_MULTIPLIER = 2;

  const storedSmoothed = storage.smoothed;
  const minIndex = storage.minIndex;

  const storedLength = storedSmoothed.length;
  if (storedLength < 1) {
    return false;
  }

  const minSmoothedDistance = storedSmoothed[minIndex].distance;
  const latestSmoothedDistance = _.last(storedSmoothed).distance;

  return (storedLength - minIndex > N_POINTS_AFTER_MIN &&
          latestSmoothedDistance > MINIMUM_DISTANCE_MULTIPLIER * minSmoothedDistance &&
          latestSmoothedDistance > FAR_ENOUGH_IN_METERS);
};

/**
 * Select those smoothed values from storage that occur within the given window
 * centered on storage.minIndex.
 */
const selectAroundMinimum = (windowInSeconds, storage) => {
  const storedSmoothed = storage.smoothed;
  const minIndex = storage.minIndex;
  const minTimestamp = storedSmoothed[minIndex].timestamp;
  const timestamps = _.map(storedSmoothed, _.property('timestamp'));
  const startIdx = findFirstIndexWithinWindow(windowInSeconds, timestamps,
                                              minTimestamp);
  const endIdx = findFirstIndexAfterWindow(windowInSeconds, timestamps,
                                           minTimestamp);
  const selected = _.slice(storedSmoothed, startIdx, endIdx);
  return selected;
};

/**
 * Present timestamps and smoothed distances as longitudes and langitudes for
 * use in turf routines.
 */
const transformSmoothedToLineString = (smoothed) => {
  const timestamps = _.map(smoothed, _.property('timestamp'));
  const timeDifferences = calculateTimeSinceReferenceInSeconds(timestamps, 0);
  const distances = _.map(smoothed, _.property('distance'));
  const coordinates = _.zip(timeDifferences, distances);
  return linestring(coordinates);
};

//const transformSmoothedToLineString = (smoothed) => {
//  // FIXME: Perhaps use time differences instead of raw timestamps for numerical accuracy.
//  const coordinates =
//    _.map(smoothed, ({distance: d, timestamp: ts}) => [ts.getTime(), d]);
//  return linestring(coordinates);
//};

const interpolate = bezier;

/**
 * Interpreting the longitudes and latitudes of a LineString as timestamps and
 * distances, find the timestamp corresponding to the minimum distance.
 */
const findMinimumTimestamp = (lineString) => {
  const coordinates = lineString.geometry.coordinates;
  const length = coordinates.length;
  let minDistance = Infinity;
  let minTimestamp = null;
  let distance;
  let timestamp;
  let coordinate;
  for (let i = 0; i < length; ++i) {
    coordinate = coordinates[i];
    timestamp = coordinate[0];
    distance = coordinate[1];
    if (distance < minDistance) {
      minDistance = distance;
      minTimestamp = timestamp;
    }
  }
  if (minTimestamp) {
    minTimestamp = new Date(minTimestamp * 1e3);
  }
  return minTimestamp;
};

const replaceTimestamps = (lineString, smoothed) => {
  const referenceTimestamp = smoothed[0].timestamp;
  let copy = _.cloneDeep(lineString);
  copy.geometry.coordinates =
    _(lineString.geometry.coordinates)
    .map(([relTime, distance]) =>
      [referenceTimestamp.getTime() * 1e-3 + relTime, distance]
    )
    .value();
  return copy;
};

/**
 * Assuming that the distances and timestamps in smoothed form samples of a
 * curve, estimate the time for when the distance reaches minimum.
 */
const estimateMinimumTime = (smoothed) => {
  // FIXME: Hide the coordinate details away for easier switching of the
  // approximation or interpolation scheme. So transform curve back to smoothed
  // format.
  // FIXME: Padding for beginning and end?
  const lineString = transformSmoothedToLineString(smoothed);
  const curve = interpolate(lineString);
  const correctedCurve = replaceTimestamps(curve, smoothed);
  return findMinimumTimestamp(correctedCurve);
};

const tryToEstimatePassingTime = (storage, interpolationWindowInSeconds) => {
  let result = null;
  if (isMinimumPassed(storage)) {
    const selected = selectAroundMinimum(interpolationWindowInSeconds, storage);
    result = estimateMinimumTime(selected);
  }
  return result;
};

const createNodePassingEstimator =
  (interpolationWindowInSeconds = INTERPOLATION_WINDOW_IN_SECONDS) => {
  let storage = {
    'smoothed': [],
    'minIndex': Infinity
  };

  const estimatePassingTime = (smoothed) => {
    storage = updateStorage(storage, smoothed);
    return tryToEstimatePassingTime(storage, interpolationWindowInSeconds);
  };

  return estimatePassingTime;
};

export {createNodePassingEstimator};



// FIXME: Remove when sure that it's not needed
//updateStored = (storedSmoothed, minIndex, smoothed) {
//  let minSmoothedDistance = storedSmoothed[minIndex].distance;
//  let length = smoothed.length;
//  let storedLength = storedSmoothed.length;
//
//  for (let i = 0; i < length; ++i) {
//    let smoothedDistance = smoothed[i].distance;
//    if (smoothedDistance < minSmoothedDistance) {
//      minSmoothedDistance = smoothedDistance;
//      minIndex = storedLength + i;
//    }
//  }
//  storedSmoothed = storedSmoothed.concat(smoothed);
//
//  return {
//    storedSmoothed,
//    minIndex
//  }
//}

//let createNodePassingTimeEstimator = (smooth) => {
//  let storedSmoothed = [];
//  let minIndex = Infinity;
//  let minSmoothedDistance = Infinity;
//
//  estimatePassingTime = (rawDistance, timestamp) => {
//    // smooth input
//    // check if new minimum distance
//    // estimate if global minimum distance
//    // if yes
//    //   interpolate around minimum distance and find minimum of interpolated curve
//    //   return timestamp
//    // if no
//    //   return empty list
//
//    let smoothed = smooth(rawDistance, timestamp);
//
//    let updated = updateStored(storedSmoothed, minIndex, smoothed);
//    storedSmoothed = updated.storedSmoothed;
//    minIndex = updated.minIndex;
//    minSmoothedDistance = storedSmoothed[minIndex];
//
//    //if (!_.isEmpty(smoothed)) {
//    //  smoothedResults = smoothedResults.concat(smoothed);
//    //  _.forEach(smoothed, {distance, timestamp} => {
//    //    if (distance < minSmoothedDistance) {
//    //      minSmoothedDistance = distance;
//    //      minSmoothedTimestamp = timestamp;
//    //    }
//    //  });
//    //}
//
//    let result = null;
//    let storedLength = storedSmoothed.length;
//    let latestSmoothedDistance = _.last(storedSmoothed).distance;
//    // FIXME: check conditions for starting bezier
//    if (storedLength - minIndex > N_POINTS_AFTER_MIN &&
//        latestSmoothedDistance > MINIMUM_DISTANCE_MULTIPLIER * minSmoothedDistance &&
//        latestSmoothedDistance > FAR_ENOUGH_IN_METERS) {
//      // FIXME:
//      // Do Bezier fitting
//      // Find minimum
//
//
//      // interpolate :: smoothedLinestring, focusIndex, timewindow -> interpolationCurve
//      // findMinimum
//      //
//      let minTimestamp = storedSmoothed[minIndex].timestamp;
//      let timestamps = _.map(storedSmoothed, _.property('timestamp'));
//      let interpolationStartIdx =
//        findFirstIndexWithinWindow(INTERPOLATION_WINDOW_IN_SECONDS, timestamps,
//                                   minTimestamp);
//      let interpolationEndIdx =
//        findFirstIndexAfterWindow(INTERPOLATION_WINDOW_IN_SECONDS, timestamps,
//                                  minTimestamp);
//      let idxArray = _.range(interpolationStartIdx, interpolationEndIdx)
//      let smoothedToInterpolate = _.at(storedSmoothed, idxArray);
//
//      let lineString = transformSmoothedToLineString(smoothedToInterpolate);
//      let bezierCurve = bezier(lineString);
//      result = findMinimumTimestamp(bezierCurve);
//
//      // Find t seconds before and after the minimum fix.
//      // pick the relevant distances by time window,
//      // calculate time differences
//      // create a linestring with (relative time, smoothed distance) as points
//      // bezier(linestring)
//      // find minimum
//    }
//
//    return result;
//  };
//
//  return estimatePassingTime;
//};
