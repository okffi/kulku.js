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
import should from 'should';

import {createJourneyWatcher} from '../src/journey_watcher';
import {fakeRealisticMobilityData} from './helpers';

describe('createJourneyWatcher', () => {
  it('does not throw with default arguments', () => {
    should(createJourneyWatcher).not.throw();
  });

  describe('isJourneyOver', () => {
    const radius = 10;
    const durationLimit = 100;
    const isJourneyOver = createJourneyWatcher(radius, durationLimit);
    const fakeData = fakeRealisticMobilityData();

    it('returns false for the fake jogging data', () => {
      _(fakeData.fixes)
        .map(isJourneyOver)
        .some()
        .should.be.false; // jshint ignore:line
    });

    it('returns true for the same pair of coordinates repeated', () => {
      const repeatedCoordinates = {
        longitude: 0,
        latitude: 0
      };
      const firstTime = _.first(fakeData.fixTimes);
      const durationInSeconds = 120;
      const timeStepInSeconds = 10;

      // FIXME: _.range can only handle integers.
      const times = _.range(firstTime, firstTime + 1e3 * durationInSeconds,
                            1e3 * timeStepInSeconds);
      const dates = _.map(times, t => new Date(t));
      const coordinates = _.times(_.size(dates),
                                  _.constant(repeatedCoordinates));

      const fixes = _(coordinates)
        .zip(dates)
        .map(([coordinates, date]) => {
          return {
            'type': 'Feature',
            'properties': {
              'timestamp': date
            },
            'geometry': {
              'type': 'Point',
              'coordinates': [coordinates.longitude, coordinates.latitude]
            }
          };
        })
        .value();

      _(fixes)
        .map(isJourneyOver)
        .some()
        .should.be.true; // jshint ignore:line
    });
  });
});
