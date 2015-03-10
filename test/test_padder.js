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

import {padToSymmetry} from '../src/padder';

import {throwOnNotArray} from './helpers';

describe('padToSymmetry', () => {
  it('accepts empty arrays with any index', () => {
    // Any index value is fine.
    const padded = padToSymmetry(0, [], []);
    padded.should.have.property('distances', []);
    padded.should.have.property('timeDifferences', []);
  });

  it('throws on an index outside of the given arrays', () => {
    const distances = [1, 2, 3];
    const timeDifferences = [-0.5, 2, 4];
    const msg = 'index must be within bounds.';
    _.partial(padToSymmetry, -1, distances, timeDifferences).should.throw(msg);
    _.partial(padToSymmetry, 3, distances, timeDifferences).should.throw(msg);
  });

  it('throws on non-arrays', () => {
    const distances = [1, 2, 3];
    const timeDifferences = [-0.5, 2, 4];
    const msg = 'distances and timeDifferences must be arrays.';

    throwOnNotArray(_.partial(padToSymmetry, _, timeDifferences), msg);
    throwOnNotArray(_.partial(padToSymmetry, distances, _), msg);
  });

  it('does not modify input', () => {
    const distances = [1, 2, 3];
    const oldDistances = [1, 2, 3];
    const timeDifferences = [-0.5, 2, 4];
    const oldTimeDifferences = [-0.5, 2, 4];
    const index = 0;
    padToSymmetry(index, distances, timeDifferences);
    distances.should.eql(oldDistances);
    timeDifferences.should.eql(oldTimeDifferences);
  });

  it('returns a copy of the input if array lengths are 1', () => {
    const index = 0;
    const distances = [2];
    const timeDifferences = [7];
    const padded = padToSymmetry(index, distances, timeDifferences);
    padded.should.have.property('index', 0);
    padded.should.have.property('distances', distances);
    padded.should.have.property('timeDifferences', timeDifferences);
  });

  it('returns a copy of the input if no padding is needed', () => {
    const distances = [1, 2, 3];
    const timeDifferences = [5.5, 7, 10];
    const index = 1;
    const padded = padToSymmetry(index, distances, timeDifferences);
    padded.should.have.property('index', 1);
    padded.should.have.property('distances', distances);
    padded.should.have.property('timeDifferences', timeDifferences);
  });

  it('appends correctly for small input', () => {
    const distances = [1, 2, 3];
    const timeDifferences = [5.5, 7, 10];
    const index = 2;
    const padded = padToSymmetry(index, distances, timeDifferences);
    padded.should.have.property('index', 2);
    padded.should.have.property('distances', [1, 2, 3, 3, 3]);
    // FIXME: Add approximate testing here.
    padded.should.have.property('timeDifferences', [5.5, 7, 10, 13, 14.5]);
  });

  it('prepends correctly for small input', () => {
    const distances = [1, 2, 3];
    const timeDifferences = [5.5, 7, 10];
    const index = 0;
    const padded = padToSymmetry(index, distances, timeDifferences);
    padded.should.have.property('index', 2);
    padded.should.have.property('distances', [1, 1, 1, 2, 3]);
    // FIXME: Add approximate testing here.
    padded.should.have.property('timeDifferences', [1, 4, 5.5, 7, 10]);
  });

  it('prepends correctly for medium input', () => {
    const distances = [3, 4, 5, 6, 7, 9, 4, 2];
    const timeDifferences = [5.5, 7, 10, 15, 21, 29, 31, 33];
    const index = 2;
    const padded = padToSymmetry(index, distances, timeDifferences);
    padded.should.have.property('index', 5);
    padded.should.have.property('distances', [3, 3, 3, 3, 4, 5, 6, 7, 9, 4, 2]);
    // FIXME: Add approximate testing here.
    padded.should.have.property('timeDifferences', [-13, -11, -9, 5.5, 7, 10,
                                                    15, 21, 29, 31, 33]);
  });

  // Unrealistic input, so should we even test for it?
  // Perhaps there's a floating point issue with x - x.
  it('accepts non-zero time difference at index', () => {
    const distances = [1, 2, 3];
    const timeDifferences = [-0.5, 2, 4];
    const index = 0;
    const padded = padToSymmetry(index, distances, timeDifferences);
    padded.should.have.property('index', 2);
    padded.should.have.property('distances', [1, 1, 1, 2, 3]);
    // FIXME: Add approximate testing here.
    padded.should.have.property('timeDifferences', [-5, -3, -0.5, 2, 4]);
  });
});
