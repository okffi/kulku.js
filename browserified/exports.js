/**
 * Use this file to browserify a global object.
 */

import kulku from '../index';

var inWindow = window.kulku || {};
inWindow = kulku;
window.kulku = inWindow;
