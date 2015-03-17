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

import {isFix} from './fix';
import {
  calculateDistanceInMeters,
  calculateTimeDifferenceInSeconds
} from './util';


const DEFAULT_STATIONARY_RADIUS_IN_METERS = 100;
const DEFAULT_STATIONARY_DURATION_LIMIT_IN_SECONDS = 300;

/**
 * Create a function to figure out whether a journey has ended.
 */
const createJourneyWatcher =
  (stationaryRadiusInMeters = DEFAULT_STATIONARY_RADIUS_IN_METERS,
   stationaryDurationLimitInSeconds =
     DEFAULT_STATIONARY_DURATION_LIMIT_IN_SECONDS) => {
  // FIXME: Check arguments.
  let fixes = [];

  /**
   * Return true if the journey seems to have stopped.
   *
   * Assume that fixes are given in chronological order.
   */
  const isJourneyOver = (fix) => {
    if (!isFix(fix)) {
      throw new Error('fix must be a valid fix.');
    }

    let isOver = false;

    const lastToRemoveIndex = _(fixes)
      .map(_.partial(calculateDistanceInMeters, fix))
      .findLastIndex(distance => distance > stationaryRadiusInMeters);
    if (lastToRemoveIndex >= 0) {
      fixes = _.slice(fixes, lastToRemoveIndex + 1);
    }
    if (!_.isEmpty(fixes)) {
      const firstTimestamp = _.first(fixes).properties.timestamp;
      const duration =
        calculateTimeDifferenceInSeconds(fix.properties.timestamp,
                                         firstTimestamp);
      isOver = duration > stationaryDurationLimitInSeconds;
    }
    fixes.push(fix);
    return isOver;
  };

  return isJourneyOver;
};

export {createJourneyWatcher};
