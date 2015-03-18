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

const isLineString = (lineString) => {
  if (!lineString) {
    return false;
  }
  if (lineString.type !== 'Feature') {
    return false;
  }

  const geometry = lineString.geometry;
  if (!geometry || geometry.type !== 'LineString') {
    return false;
  }
  // Let's not check coordinate values and get into the trouble of verifying
  // coordinate reference systems.
  const coordinates = geometry.coordinates;
  if (!_.isArray(coordinates) ||
      _.isEmpty(coordinates) ||
      !_.every(_.map(coordinates, _.isArray))) {
    return false;
  }

  if (!lineString.properties) {
    return false;
  }

  return true;
};

export {isLineString};
