'use strict';

var urlJoin = require('url-join');
var urlParse = require('url-parse');

function getBaseUrl(db) {
  if (typeof db.getUrl === 'function') { // pouchdb pre-6.0.0
    return urlParse(db.getUrl()).origin;
  } else { // pouchdb post-6.0.0
    return urlParse(db.name).origin;
  }
}

exports.getUsersUrl = function (db) {
  return urlJoin(getBaseUrl(db), '/_users');
};
exports.getSessionUrl = function (db) {
  return urlJoin(getBaseUrl(db), '/_session');
};
