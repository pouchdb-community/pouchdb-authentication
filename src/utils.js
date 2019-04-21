'use strict';

import urlJoin from 'url-join';
import urlParse from 'url-parse';
import inherits from 'inherits';
import { btoa } from 'pouchdb-binary-utils';
import { assign } from 'pouchdb-utils';

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

function wrapError(err) {
  if (err.name === 'unknown_error') {
    err.message = (err.message || '') +
        ' Unknown error!  Did you remember to enable CORS?';
  }
  throw err;
}

// Injects `fetch` with instructions to pass and receive cookies
function makeFetchWithCredentials(fetchFunc) {
  return function fetchWithCredentials(url, args) {
    return fetchFunc(url, assign(args, { credentials: 'include' }));
  };
}

// Wrapper around the fetch API to send and receive JSON objects
// Similar to fetchJSON in pouchdb-adapter-http, but both functions are private.
// Consider extracting them to a common library.
function fetchJSON(fetchWithCredentials, url, args) {
  if (args.body) {
    args = assign(args, {
      body: JSON.stringify(args.body),
      headers: assign(
        {'Content-Type': 'application/json', 'Accept': 'application/json'},
        args.headers || {}
      ),
    });
  }

  return fetchWithCredentials(url, args).then(response => {
    if (response.ok) {
      return response.json();
    } else {
      return response.json().then(responseError => {
        throw responseError;
      });
    }
  }).catch(wrapError);
}

// toCallback takes a function that returns a promise,
// and returns a function that can be used with a callback as the last argument,
// but still retains the ability to be used without a callback and return a promise.
// (Roughly speaking, the opposite of `toPromise` from pouchdb-utils,
// but more suited for `fetch`, that returns a promise by default.)
function toCallback(func) {
  return function (...args) {
    if (typeof args[-1] === 'function') {
      var callback = args[-1];
      return func.apply(this, args.slice(0, -2)).then(
        res => callback(null, res),
        err => callback(err)
      );
    } else {
      return func.apply(this, args);
    }
  }
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
  makeFetchWithCredentials,
  fetchJSON,
  toCallback
};
