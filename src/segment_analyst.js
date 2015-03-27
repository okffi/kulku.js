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

import {createLineStringTraverser} from './linestring_traverser';
import {isLineString} from './linestring';

const createSegmentAnalyst = (lineString, analyse = calculateAverageSpeed,
                              analysisName = 'averageSpeed') => {
  if (!isLineString(lineString)) {
    throw new Error('lineString must be a GeoJSON LineString.');
  }
  if (!_.isString(analysisName) || _.isEmpty(analysisName) ||
      analysisName === 'start' || analysisName === 'end') {
    throw new Error('analysisName must be a non-empty string but not ' +
                    '\'start\' or \'end\'.');
  }

  let latestPassedNode = null;
  const traverseSegments = createLineStringTraverser(lineString);

  const analyseSegments = (fix) => {
    let result = [];
    const traversed = traverseSegments(fix);
    if (!_.isEmpty(traversed)) {
      let nodes;
      if (latestPassedNode) {
        nodes = [latestPassedNode].concat(traversed);
      } else {
        nodes = traversed;
      }

      const segments = _(nodes)
        .initial()
        .zip(_.rest(nodes))
        .value();
      const analyses = _.map(segments, _.spread(analyse));
      result = _(segments)
        .zip(analyses)
        .map(([[start, end], oneAnalysis]) => {
          let segment = {
            start,
            end
          };
          segment[analysisName] = oneAnalysis;
          return segment;
        })
        .value();
      latestPassedNode = _.last(traversed);
    }
    return result;
  };

  return analyseSegments;
};

export {createSegmentAnalyst};
