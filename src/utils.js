'use strict';

import urlJoin from 'url-join';
import urlParse from 'url-parse';
import inherits from 'inherits';

function getBaseUrl(db) {
  if (typeof db.getUrl === 'function') { // pouchdb pre-6.0.0
    return urlParse(db.getUrl()).origin;
  } else if (db.__opts && db.__opts.prefix) { // PouchDB.defaults
    return db.__opts.prefix;
  } else { // pouchdb post-6.0.0
    return urlParse(db.name).origin;
  }
}

function getUsersUrl(db) {
  return urlJoin(getBaseUrl(db), '/_users');
}

function getSessionUrl(db) {
  return urlJoin(getBaseUrl(db), '/_session');
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

export { AuthError, getSessionUrl, getUsersUrl, wrapError };
