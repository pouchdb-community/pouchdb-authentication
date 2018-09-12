'use strict';

import urlJoin from 'url-join';
import urlParse from 'url-parse';
import inherits from 'inherits';
import { btoa } from 'pouchdb-binary-utils';
import Axios from 'axios';

function axios(opts) {
  opts = Object.assign({ withCredentials: true }, opts);
  return Axios(opts)
  .then(function(res){
    return res.data
  })
  .catch(function(err){
    if (err.response.data) {
      Object.assign(err, err.response.data);
      if (err.response.statusText)
        Object.assign(err, {
          name: err.response.statusText.toLowerCase(),
          status: err.response.status
        })
    }
    throw err;
  })
}

function getBaseUrl(db) {
  // Parse database url
  let url;
  if (typeof db.getUrl === 'function') { // pouchdb pre-6.0.0
    url = urlParse(db.getUrl());
  } else { // pouchdb post-6.0.0
    // Use PouchDB.defaults' prefix, if any
    let prefix = db.__opts && db.__opts.prefix ? db.__opts.prefix + '/' : '';
    url = urlParse(prefix + db.name);
  }

  // Compute parent path for databases not hosted on domain root (see #215)
  let path = url.pathname;
  path = path.substr(-1, 1) === '/' ? path.substr(0, -1) : path;
  let parentPath = path.split('/').slice(0, -1).join('/');

  return url.origin + parentPath;
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
  var auth;

  if (db.__opts.auth) {
    auth = db.__opts.auth;
  } else {
    var url = urlParse(db.name);
    if (url.auth) {
      auth = url;
    }
  }

  if (!auth) {
    return {};
  }

  var str = auth.username + ':' + auth.password;
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
  axios,
};
