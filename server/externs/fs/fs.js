/**
 * @license
 * Code City: Closure Compiler externs for node.js
 *
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Fake implementation of node.js's fs module to satisfy
 *     Closure Compiler dependencies.  This is mostly an excerpt from
 *     contrib/nodejs/fs.js from
 *     https://github.com/google/closure-compiler.git
 * @author cpcallen@google.com (Christopher Allen)
 */

// TODO(cpcallen): Use official externs directly.

// TODO(cpcallen): Factor this out to a separate buffer module extern.
/** @constructor */
var Buffer = function() {};

/** @const */
var fs = {};

/**
 * @param {string} path
 * @param {number} mode
 */
fs.accessSync = function(path, mode) {};

/**
 * @param {string} path
 * @return {Array.<string>}
 */
fs.readdirSync = function(path) {};

/**
 * @param {string} filename
 * @param {string=} encoding
 * @return {string|Buffer}
 */
fs.readFileSync = function(filename, encoding) {};

/**
 * @param {string} oldPath
 * @param {string} newPath
 * @return {void}
 */
fs.renameSync = function(oldPath, newPath) {};

/**
 * @param {string} path
 * @return {void}
 */
fs.unlinkSync = function(path) {};

/**
 * @param {string} filename
 * @param {*} data
 * @param {string=} encoding
 * @return {void}
 */
fs.writeFileSync = function(filename, data, encoding) {};

module.exports = fs;
