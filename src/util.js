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
import turf from 'turf';

const isNonNegative = (x) => _.isFinite(x) && x >= 0;

/**
 * Calculates date1 - date2 in seconds.
 */
const calculateTimeDifferenceInSeconds = (date1, date2) => {
  return 1e-3 * (date1.getTime() - date2.getTime());
};

/**
 * Given an array of Dates and an index, calculates the time difference of each
 * Date to the Date at index. Larger dates get positive sign, smaller dates
 * negative.
 */
const calculateTimeSinceReferenceInSeconds = (dateArray, index) => {
  return _.map(dateArray, _.partial(calculateTimeDifferenceInSeconds, _,
                                    dateArray[index]));
};

/**
 * Inclusive. Suitable for the first argument of _.range().
 */
const findFirstIndexWithinWindow = (windowInSeconds, timestamps, center) => {
  return _.sortedIndex(timestamps, new Date(center.getTime() -
                                            1e3 * 0.5 * windowInSeconds));
};

/**
 * Exclusive. Suitable for the second argument of _.range().
 */
const findFirstIndexAfterWindow = (windowInSeconds, timestamps, center) => {
  return _.sortedIndex(timestamps, new Date(center.getTime() +
                                            1e3 * 0.5 * windowInSeconds));
};

/**
 * Calculate the distance between two GeoJSON points in meters.
 */
const calculateDistanceInMeters = (point1, point2) => {
  return 1e3 * turf.distance(point1, point2, 'kilometers');
};

export {
  calculateDistanceInMeters,
  calculateTimeDifferenceInSeconds,
  calculateTimeSinceReferenceInSeconds,
  findFirstIndexAfterWindow,
  findFirstIndexWithinWindow,
  isNonNegative
};
