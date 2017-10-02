'use strict';

var Promise = require('pouchdb-promise');
var pouchdbUtils = require('pouchdb-utils');
var urlJoin = require('url-join');

function getBaseUrl(db) {
  if (typeof db.getUrl === 'function') { // pouchdb pre-6.0.0
    return db.getUrl().replace(/\/[^\/]+\/?$/, '');
  } else { // pouchdb post-6.0.0
    return db.name.replace(/\/[^\/]+\/?$/, '');
  }
}
exports.getUsersUrl = function (db) {
  return urlJoin(getBaseUrl(db), '/_users');
};
exports.getSessionUrl = function (db) {
  return urlJoin(getBaseUrl(db), '/_session');
};

exports.inherits = require('inherits');
exports.extend = require('pouchdb-extend');
exports.ajax = require('pouchdb-ajax');
exports.clone = pouchdbUtils.clone;
exports.uuid = pouchdbUtils.uuid;
exports.once = pouchdbUtils.once;
exports.toPromise = pouchdbUtils.toPromise;
exports.Promise = Promise;
