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

import {isNonNegative} from './util';

let transformLeafletPositionToFix = (leafletEvent) => {
  let latlng = leafletEvent.latlng;
  let coordinates = {
    'longitude': latlng.lng,
    'latitude': latlng.lat
  };

  coordinates = _(leafletEvent)
                .omit(['latlng', 'timestamp'])
                .assign(coordinates)
                .value();

  let timestamp = new Date(leafletEvent.timestamp);

  return createFix(coordinates, timestamp);
};

/**
 * Create a GeoJSON fix from a coordinates object and a timestamp.
 *
 * The function stores only finite values.
 *
 * @param coordinates {Object} The object must follow the Coordinates interface
 * in the Geolocation API Specification W3C Recommendation 2013-10-24.
 * @param timestamp {Date}
 * @see http://www.w3.org/TR/2013/REC-geolocation-API-20131024/#coordinates_interface
 */
let createFix = (coordinates, timestamp) => {
  const longitude = coordinates.longitude;
  if (!_.isNumber(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('coordinates.longitude must be a number on the interval ' +
                    '[-180, 180].');
  }
  const latitude = coordinates.latitude;
  if (!_.isNumber(latitude) || latitude < 0 || latitude > 90) {
    throw new Error('coordinates.latitude must be a number on the interval ' +
                    '[0, 90].');
  }

  let coords = [longitude, latitude];

  const altitude = coordinates.altitude;
  if (altitude) {
    if (!_.isFinite(altitude)) {
      throw new Error('coordinates.altitude, if specified, must be a finite ' +
                      'number or null.');
    }
    coords.push(altitude);
  }

  let properties = _(coordinates)
                   .pick(['speed', 'accuracy', 'altitudeAccuracy'])
                   .pick(isNonNegative)
                   .value();

  const heading = coordinates.heading;
  if (heading && (!properties.speed || properties.speed !== 0)) {
    if (!isNonNegative(heading) || heading >= 360) {
      throw new Error('coordinates.heading, if specified, must be either a ' +
                      'NaN in case coordinates.speed is 0 or a number ' +
                      'between [0, 360[ or null.');
    }
    properties.heading = heading;
  }

  if (!_.isDate(timestamp)) {
    throw new Error('timestamp must be a Date object.');
  }
  properties.timestamp = timestamp;

  return turf.point(coords, properties);
};

export {createFix, transformLeafletPositionToFix};
