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

import {createSegmentAnalyst} from '../src/segment_analyst';
import {calculateAverageSpeed} from '../src/average_speed';

import {fakeRealisticMobilityData} from './helpers';

describe('createSegmentAnalyst', () => {
  describe('easy itinerary with fake fixes', () => {
    const analyse = calculateAverageSpeed;
    const analysisName = 'averageSpeed';
    const fakeData = fakeRealisticMobilityData();

    it('accepts averageSpeed as the argument analyse', () => {
      should(_.partial(createSegmentAnalyst, fakeData.itineraryFeature, analyse,
                       analysisName))
        .not.throw();
    });

    describe('analyseSegments', () => {
      const analyseSegments = createSegmentAnalyst(fakeData.itineraryFeature,
                                                   analyse, analysisName);

      it('returns non-negative speeds for fake data', () => {
        const analysed = _.map(fakeData.fixes, analyseSegments);
        _(analysed)
          .reject(_.isEmpty)
          .flatten()
          .forEach(analysis => {
            should(analysis).have.property(analysisName).match(x => x >= 0);
          })
          .value();
      });
    });
  });
});
