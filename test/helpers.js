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

// FIXME: Replace with jsverify.
let throwOnNotArray = (func, msg) => {
  _.partial(func, 'foo').should.throw(msg);
  _.partial(func, '').should.throw(msg);
  _.partial(func, '123').should.throw(msg);
  _.partial(func, true).should.throw(msg);
  _.partial(func, 0).should.throw(msg);
  _.partial(func, {}).should.throw(msg);
  _.partial(func, () => {}).should.throw(msg);
  _.partial(func, null).should.throw(msg);
  _.partial(func, undefined).should.throw(msg);
  _.partial(func).should.throw(msg);
};

// FIXME: Replace with jsverify.
let throwOnNotNumber = (func, msg) => {
  _.partial(func, 'foo').should.throw(msg);
  _.partial(func, '').should.throw(msg);
  _.partial(func, '123').should.throw(msg);
  _.partial(func, true).should.throw(msg);
  _.partial(func, {}).should.throw(msg);
  _.partial(func, []).should.throw(msg);
  _.partial(func, () => {}).should.throw(msg);
  _.partial(func, null).should.throw(msg);
  _.partial(func, undefined).should.throw(msg);
  _.partial(func).should.throw(msg);
};

export {throwOnNotArray, throwOnNotNumber};
