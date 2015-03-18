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

import {
  calculateDistanceInMeters,
  calculateTimeDifferenceInSeconds
} from './util';

/**
 * @param start {Object} something returned by the return value of
 *   traverseItinerary().
 * @param end {Object} something returned by the return value of
 *   traverseItinerary().
 */
const calculateAverageSpeed = (start, end) => {
  const distance = calculateDistanceInMeters(end.node, start.node);
  const duration = calculateTimeDifferenceInSeconds(end.timestamp,
                                                    start.timestamp);
  return distance / duration;
};

export {calculateAverageSpeed};
