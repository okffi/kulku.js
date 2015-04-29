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
