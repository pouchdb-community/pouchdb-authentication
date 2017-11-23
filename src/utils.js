'use strict';

import urlJoin from 'url-join';
import urlParse from 'url-parse';
import inherits from 'inherits';
import { btoa } from 'pouchdb-binary-utils';

function getBaseUrl(db) {
  if (typeof db.getUrl === 'function') { // pouchdb pre-6.0.0
    return urlParse(db.getUrl()).origin;
  } else if (db.__opts && db.__opts.prefix) { // PouchDB.defaults
    return db.__opts.prefix;
  } else { // pouchdb post-6.0.0
    return urlParse(db.name).origin;
  }
}

function getConfigUrl(db, nodeName) {
  return urlJoin(getBaseUrl(db), (nodeName ? '/_node/' + nodeName : '') + '/_config');
}

function getUsersUrl(db) {
  return urlJoin(getBaseUrl(db), '/_users');
}

function getSessionUrl(db) {
  return urlJoin(getBaseUrl(db), '/_session');
}

function getBasicAuthHeaders(db) {
  var url = urlParse(db.name);
  if (!url.auth) {
    return {};
  }

  var str = url.username + ':' + url.password;
  var token = btoa(unescape(encodeURIComponent(str)));
  return {Authorization: 'Basic ' + token};
}

function wrapError(callback) {
  // provide more helpful error message
  return function (err, res) {
    if (err) {
      if (err.name === 'unknown_error') {
        err.message = (err.message || '') +
            ' Unknown error!  Did you remember to enable CORS?';
      }
    }
    return callback(err, res);
  };
}

function AuthError(message) {
  this.status = 400;
  this.name = 'authentication_error';
  this.message = message;
  this.error = true;
  try {
    Error.captureStackTrace(this, AuthError);
  } catch (e) {}
}

inherits(AuthError, Error);

export {
  AuthError,
  getBaseUrl,
  getBasicAuthHeaders,
  getConfigUrl,
  getSessionUrl,
  getUsersUrl,
  wrapError,
};
