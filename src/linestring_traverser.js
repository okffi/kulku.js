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

import {createNodePassingEstimator} from './node_passing';
import {createSmoother} from './smoother';
import {isLineString} from './linestring';
import {calculateDistanceInMeters, findFirstIndexWithinWindow} from './util';

const SMOOTHING_WINDOW_IN_SECONDS = 50;
// As memory only extends backwards, it's set to half a window.
const FIX_MEMORY_IN_SECONDS = SMOOTHING_WINDOW_IN_SECONDS / 2;

const createDistanceFunction = (point) => {
  return _.partial(calculateDistanceInMeters, point);
};

const forgetOldFixes = (fixMemoryInSeconds, fixes, referenceTimestamp) => {
  const timestamps = _.map(fixes, _.property('timestamp'));
  // A window looks both ways from the reference but a memory only backwards.
  const fakeWindowInSeconds = 2 * fixMemoryInSeconds;
  const startIdx = findFirstIndexWithinWindow(fakeWindowInSeconds, timestamps,
                                              referenceTimestamp);
  return _.slice(fixes, startIdx);
};

const createNodeDistanceHandler = (distanceFunction, smoothingFunction) => {
  const calculateSmoothedDistanceToNode = (fix) => {
    const distance = distanceFunction(fix);
    const timestamp = fix.properties.timestamp;
    return smoothingFunction(distance, timestamp);
  };
  return calculateSmoothedDistanceToNode;
};

const transformLineStringToPoints = (lineString) => {
  return turf.explode(lineString).features;
};

const createNodeHandler = (lineString, smoothingWindowInSeconds) => {
  const nodes = transformLineStringToPoints(lineString);
  const length = nodes.length;

  const createNodeTools = (index) => {
    // FIXME: ugly
    if (index >= length) {
      return null;
    }
    const node = nodes[index];
    const distanceFunction = createDistanceFunction(node);
    const smoothingFunction = createSmoother(smoothingWindowInSeconds);
    const calculateSmoothedDistanceToNode =
      createNodeDistanceHandler(distanceFunction, smoothingFunction);
    const estimatePassingTime = createNodePassingEstimator();
    return {
      node,
      calculateSmoothedDistanceToNode,
      estimatePassingTime
    };
  };

  return createNodeTools;
};

const createLineStringTraverser =
  (lineString,
   smoothingWindowInSeconds = SMOOTHING_WINDOW_IN_SECONDS,
   fixMemoryInSeconds = FIX_MEMORY_IN_SECONDS) => {

  if (!isLineString(lineString)) {
    throw new Error('lineString must be a valid GeoJSON LineString.');
  }

  const nodeHandler = createNodeHandler(lineString, smoothingWindowInSeconds);
  let fixes = [];
  let node = null;
  let smooth = null;
  let estimatePassingTime = null;

  const prepareNextSegment = () => {
    const nodeTools = nodeHandler(focusedIdx);
    if (nodeTools) {
      node = nodeTools.node;
      smooth = nodeTools.calculateSmoothedDistanceToNode;
      estimatePassingTime = nodeTools.estimatePassingTime;
    } else {
      node = null;
      smooth = null;
      estimatePassingTime = null;
    }
  };

  let focusedIdx = 0;
  prepareNextSegment();

  const forget = _.partial(forgetOldFixes, fixMemoryInSeconds);

  const traverseLineString = (fix) => {
    fixes.push(fix);
    let passedNodes = [];
    let passingTime = estimatePassingTime(smooth(fix));
    while (passingTime) {
      passedNodes.push({
        node,
        'timestamp': passingTime
      });
      fixes = forget(fixes, passingTime);
      // FIXME: Ugly.
      ++focusedIdx;
      prepareNextSegment();
      if (smooth) {
        passingTime = _(fixes)
          .map(smooth)
          .map(estimatePassingTime)
          .filter(_.isDate)
          .last();
      } else {
        passingTime = null;
      }
    }
    return passedNodes;
  };

  return traverseLineString;
};

export {createLineStringTraverser};
