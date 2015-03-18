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

import turf from 'turf';

const DEFAULT_OFF_ITINERARY_DISTANCE_IN_METERS = 50;
const DEFAULT_CONSECUTIVE_OFF_LIMIT = 3;

const createItineraryWatcher =
  (lineString,
   offItineraryDistanceInMeters = DEFAULT_OFF_ITINERARY_DISTANCE_IN_METERS,
   consecutiveOffLimit = DEFAULT_CONSECUTIVE_OFF_LIMIT) => {
  let nConsecutiveOff = 0;

  const isOnItinerary = (fix) => {
    const distanceFromLineString =
      turf.distance(fix, turf.point-on-line(lineString, fix));

    if (distanceFromLineString > offItineraryDistanceInMeters) {
      ++nConsecutiveOff;
    } else {
      nConsecutiveOff = 0;
    }

    return nConsecutiveOff <= consecutiveOffLimit;
  };

  return isOnItinerary;
};

export {createItineraryWatcher};
