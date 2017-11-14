'use strict';

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
