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

// FIXME: Import again, when you get the jsverify tests working.
//import jsc from 'jsverify';
import _ from 'lodash';
import should from 'should';

import {createSmoother} from '../src/smoother';
// FIXME: Import again, when you get the jsverify tests working.
//import {isNonNegative} from '../src/util';

import {throwOnNotNumber} from './helpers';

describe('createSmoother', () => {
  const msg = 'windowInSeconds must be a positive Number.';

  it('accepts a positive Number', () => {
    _.partial(createSmoother, 30).should.not.throw();
  });
  it('accepts zero', () => {
    _.partial(createSmoother, 0).should.not.throw();
  });
  it('accepts Infinity', () => {
    _.partial(createSmoother, Infinity).should.not.throw();
  });
  it('throws on a negative Number', () => {
    _.partial(createSmoother, -20).should.throw(msg);
    _.partial(createSmoother, -Infinity).should.throw(msg);
  });
  it('throws on NaN ', () => {
    _.partial(createSmoother, NaN).should.throw(msg);
  });
  it('throws on a non-Number', () => {
    throwOnNotNumber(createSmoother, msg);
  });
});

describe('smooth', () => {
  describe('input checking', () => {
    const date = new Date(1423729377231);
    const distanceMsg = 'distance must be a non-negative Number and not NaN.';
    var smooth;

    beforeEach(() => {
      smooth = createSmoother(60);
    });

    it('throws on non-Number distance', () => {
      throwOnNotNumber(_.partial(smooth, _, date), distanceMsg);
    });
    it('accepts a positive distance', () => {
      _.partial(smooth, 4, date).should.not.throw();
    });
    it('accepts zero distance', () => {
      _.partial(smooth, 0, date).should.not.throw();
    });
    it('throws on negative distance', () => {
      _.partial(smooth, -4, date).should.throw(distanceMsg);
    });
  });

  describe('output checking', () => {
    const date = new Date(1423729377231);
    var smooth;

    beforeEach(() => {
      smooth = createSmoother(60);
    });

    it('returns an empty array for the first distance', () => {
      smooth(4, date).should.be.empty; // jshint ignore:line
    });
  });

  let unixTimesToDates = times => _.map(times, time => new Date(time));
  let smoothArraysFunc = (func, distances, dates) =>
                           _(_.zip(distances, dates))
                           .map(dd => func(dd[0], dd[1]))
                           .value();

  describe('simple input', () => {
    const dates = unixTimesToDates([1423729370000,
                                    1423729371000,
                                    1423729372000,
                                    1423729373000,
                                    1423729374000]);
    const distances = [5, 4, 3, 2, 1];
    const windowInSeconds = 3;
    const epsilon = 1e-10;
    let smooth = createSmoother(windowInSeconds);
    let smoothArrays = _.partial(smoothArraysFunc, smooth);
    let results = smoothArrays(distances, dates);

    it('first result correct', () => {
      (results[0]).should.be.empty; // jshint ignore:line
    });
    it('second result correct', () => {
      (results[1]).should.be.empty; // jshint ignore:line
    });
    it('third result correct', () => {
      (results[2][0]).should.have.property('distance').be.approximately((1/3 * 5 + 5 + 1/3 * 4) / (5/3), epsilon);
      (results[2][0]).should.have.property('timestamp', dates[0]);
    });
    it('fourth result correct', () => {
      (results[3][0]).should.have.property('distance').be.approximately(distances[1], epsilon);
      (results[3][0]).should.have.property('timestamp', dates[1]);
    });
    it('fifth result correct', () => {
      (results[4][0]).should.have.property('distance').be.approximately(distances[2], epsilon);
      (results[4][0]).should.have.property('timestamp', dates[2]);
    });
  });

  describe('almost simple input', () => {
    const dates = unixTimesToDates([1423729370000,
                                    1423729372000,
                                    1423729373000,
                                    1423729375000,
                                    1423729376000]);
    const distances = [5, 4, 3, 2, 1];
    const windowInSeconds = 5;
    const epsilon = 1e-10;
    let smooth = createSmoother(windowInSeconds);
    let smoothArrays = _.partial(smoothArraysFunc, smooth);
    let results = smoothArrays(distances, dates);

    it('first result correct', () => {
      (results[0]).should.be.empty; // jshint ignore:line
    });
    it('second result correct', () => {
      (results[1]).should.be.empty; // jshint ignore:line
    });
    it('third result correct', () => {
      (results[2][0]).should.have.property('distance').be.approximately((0.2 * 5 + 5 + 0.2 * 4) / (0.2 + 1 + 0.2), epsilon);
      (results[2][0]).should.have.property('timestamp', dates[0]);
    });
    it('fourth result correct', () => {
      (results[3][0]).should.have.property('distance').be.approximately((0.2 * 5 + 4 + 0.6 * 3) / (0.2 + 1 + 0.6), epsilon);
      (results[3][0]).should.have.property('timestamp', dates[1]);
    });
    it('fifth result correct', () => {
      (results[4][0]).should.have.property('distance').be.approximately((0.6 * 4 + 3 + 0.2 * 2) / (0.6 + 1 + 0.2), epsilon);
      (results[4][0]).should.have.property('timestamp', dates[2]);
    });
  });

//  // FIXME: Fix this.
//  describe('property based checking', () => {
//    const windowInSeconds = 5;
//    let smooth = createSmoother(windowInSeconds);
//    jsc.property('produces output between minimum and maximum of input',
//                 '[number]', '[datetime]', (distances, timestamps) => {
//      // FIXME: Make jsverify do the hard work of finding non-negative numbers.
//      const suitableDistances = _.takeWhile(distances, isNonNegative);
//      const min = _.min(suitableDistances);
//      const max = _.max(suitableDistances);
//      console.log('distances ', distances);
//      console.log('timestamps ', timestamps);
//      if (!_.isEmpty(suitableDistances) && !_.isEmpty(timestamps)) {
//        const isAllWithin =
//          _(suitableDistances)
//          .zip(timestamps)
//          .takeWhile(([distance, timestamp]) =>
//                     (distance || distance === 0) && timestamp)
//          // FIXME: Remove when working.
//          .map(([d, t]) => {
//            console.log('d: ', d, ', t: ', t);
//            return [d, t]; })
//          .map(([distance, timestamp]) => smooth(distance, timestamp))
//          .dropWhile(_.isEmpty)
//          .flatten()
//          .map(_.property('distance'))
//          .every(distance => distance >= min && distance <= max)
//          .value();
//        should(isAllWithin).be.true;
//      }
//      should(true).be.true;
//    });
//  });

//  // FIXME: Finish this one.
//  describe('a few distances at realistic intervals', () => {
//    const dates = _.map([1423729375533,
//                         1423729377231,
//                         1423729380561,
//                         1423729381859,
//                         1423729387284],
//                        unixTime => new Date(unixTime));
//    const distances = [28, 20, 14.3, 9.5, 10.2];
//    const windowInSeconds = 6;
//    var smooth = createSmoother(windowInSeconds);
//
//    it('should return [] for the first distance', () => {
//      let length = dates.length;
//      let resultArray = (_.zip(distances, dates))
//                        .map(dd => smooth(dd[0], dd[1]))
//                        .value();
//      (resultArray[0]).should.eql([]);
//      (resultArray[1]).should.eql([]);
//      (resultArray[2]).should.eql([]);
//      (resultArray[3]).should.eql([]);
//      (resultArray[4]).should.eql([]);
//    });
//  });
});
