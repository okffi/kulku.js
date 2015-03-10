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

import jsc from 'jsverify';
import _ from 'lodash';
// FIXME: Import again if it can be used.
//import should from 'should';

import {isNonNegative} from '../src/util';

describe('isNonNegative', () => {
  describe('property based checking', () => {
    // FIXME: Instead of datetime, make jsverify use arbitrary type.
    jsc.property('returns only booleans', 'datetime', (x) => {
      return _.isBoolean(isNonNegative(x));
      // FIXME: Why does this not work?
      //return should(isNonNegative(x)).be.a.Boolean;
    });
    // FIXME: Instead of array, get jsverify to provide any non-numbers.
    jsc.property('returns false for non-numbers', 'array', (x) => {
      return !isNonNegative(x);
      // FIXME: Why does this not work?
      //return should(isNonNegative(x)).be.false;
    });
    jsc.property('answers correctly for normal numbers', 'number', (x) => {
      // FIXME: Use should.js for consistency.
      if (x < 0) {
        return !isNonNegative(x);
      }
      return isNonNegative(x);
    });
  });
});
