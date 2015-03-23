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
import explode from 'turf-explode';

import {createLineStringTraverser} from '../src/linestring_traverser';

import {fakeRealisticMobilityData} from './helpers';

describe('createLineStringTraverser', () => {
  describe('easy itinerary with fake fixes', () => {
    const fakeData = fakeRealisticMobilityData();
    const fixes = fakeData.fixes;
    const fixTimestamps = fakeData.fixTimestamps;
    const itineraryFeature = fakeData.itineraryFeature;

    it('does not throw on fake LineString', () => {
      _.partial(createLineStringTraverser, itineraryFeature).should.not.throw();
    });

    describe('traverseLineString', () => {
      const traverse = createLineStringTraverser(itineraryFeature);

      const rawTraversedNodes = _.map(fixes, traverse);
      const traversedNodes = _(rawTraversedNodes)
        .reject(_.isEmpty)
        .flatten()
        .value();
      const traversedTimestamps = _.map(traversedNodes,
                                        _.property('timestamp'));

      it('returns traversed nodes in feeding order', () => {
        const itineraryPointArray = explode(itineraryFeature).features;
        _(traversedNodes)
          .map(_.property('node'))
          .zip(itineraryPointArray)
          .takeWhile(([t, i]) => t && i)
          .forEach(([t, i]) => should(t).eql(i))
          .value();
      });

      it('returns timestamps in chronological order', () => {
        _.clone(traversedTimestamps).sort().should.eql(traversedTimestamps);
      });

      it('returns timestamps roughly in the same time period as fixes', () => {
        const TIME_RADIUS_IN_SECONDS = 30;
        const start = new Date(_.first(fixTimestamps).getTime() -
                               1e3 * TIME_RADIUS_IN_SECONDS);
        const end = new Date(_.last(fixTimestamps).getTime() +
                             1e3 * TIME_RADIUS_IN_SECONDS);
        _.every(traversedTimestamps, t => t >= start && t <= end)
          .should.be.true; // jshint ignore:line
      });
    });
  });
});
