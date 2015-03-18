require('traceur/bin/traceur-runtime');

var average_speed = require('./lib/average_speed.js');
var fix = require('./lib/fix.js');
var itinerary_watcher = require('./lib/itinerary_watcher.js');
var journey_watcher = require('./lib/journey_watcher.js');
var linestring = require('./lib/linestring.js');
var linestring_traverser = require('./lib/linestring_traverser.js');
var node_passing = require('./lib/node_passing.js');
var padder = require('./lib/padder.js');
var segment_analyst = require('./lib/segment_analyst.js');
var smoother = require('./lib/smoother.js');
var util = require('./lib/util.js');

// FIXME: Consider what is actually needed and hide the rest from the interface.
// One can always add to an interface.
var obj = {
  calculateAverageSpeed: average_speed.calculateAverageSpeed,
  createFix: fix.createFix,
  isFix: fix.isFix,
  transformLeafletPositionToFix: fix.transformLeafletPositionToFix,
  createItineraryWatcher: itinerary_watcher.createItineraryWatcher,
  createJourneyWatcher: journey_watcher.createJourneyWatcher,
  isLineString: linestring.isLineString,
  createLineStringTraverser: linestring_traverser.createLineStringTraverser,
  createNodePassingEstimator: node_passing.createNodePassingEstimator,
  padToSymmetry: padder.padToSymmetry,
  createSegmentAnalyst: segment_analyst.createSegmentAnalyst,
  createSmoother: smoother.createSmoother,
  calculateDistanceInMeters: util.calculateDistanceInMeters,
  calculateTimeDifferenceInSeconds: util.calculateTimeDifferenceInSeconds,
  calculateTimeSinceReferenceInSeconds:
    util.calculateTimeSinceReferenceInSeconds,
  findFirstIndexAfterWindow: util.findFirstIndexAfterWindow,
  findFirstIndexWithinWindow: util.findFirstIndexWithinWindow,
  isNonNegative: util.isNonNegative
};

obj.default = obj;
module.exports = obj;
