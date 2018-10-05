'use strict';

import urlJoin from 'url-join';
import urlParse from 'url-parse';
import inherits from 'inherits';
import { btoa } from 'pouchdb-binary-utils';
import Axios from 'axios';

function axios(opts) {
  opts = Object.assign({ withCredentials: true }, opts);
  return Axios(opts)
  .then(function (res) {
    return res.data;
  })
  .catch(function (err) {
    // console.log('err', err.message, err.request.method, err.request._header)
    if (err.response.data) {
      Object.assign(err, err.response.data);
      if (err.response.statusText)
        {Object.assign(err, {
          name: err.response.statusText.toLowerCase(),
          status: err.response.status
        });}
    }
    throw err;
  });
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

function isBinaryObject(object) {
  return object instanceof Buffer;
}

// most of this is borrowed from lodash.isPlainObject:
// https://github.com/fis-components/lodash.isplainobject/
// blob/29c358140a74f252aeb08c9eb28bef86f2217d4a/index.js

const funcToString = Function.prototype.toString;
const objectCtorString = funcToString.call(Object);

function cloneBuffer(buf) {
  let result;
  if ((Buffer.hasOwnProperty('from') && typeof Buffer.from === 'function')) {
    result = Buffer.from(buf);
  } else {
    result = new Buffer(buf.length);
    buf.copy(result);
  }
  return result;
}
function isPlainObject(value) {
  var proto = Object.getPrototypeOf(value);
  /* istanbul ignore if */
  if (proto === null) { // not sure when this happens, but I guess it can
    return true;
  }
  var Ctor = proto.constructor;
  return (typeof Ctor == 'function' &&
    Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
}

function clone(object) {
  var newObject;
  var i;
  var len;

  if (!object || typeof object !== 'object') {
    return object;
  }

  if (Array.isArray(object)) {
    newObject = [];
    for (i = 0, len = object.length; i < len; i++) {
      newObject[i] = clone(object[i]);
    }
    return newObject;
  }

  // special case: to avoid inconsistencies between IndexedDB
  // and other backends, we automatically stringify Dates
  if (object instanceof Date) {
    return object.toISOString();
  }

  if (isBinaryObject(object)) {
    return cloneBuffer(object);
  }

  if (!isPlainObject(object)) {
    return object; // don't clone objects like Workers
  }

  newObject = {};
  for (i in object) {
    /* istanbul ignore else */
    if (Object.prototype.hasOwnProperty.call(object, i)) {
      var value = clone(object[i]);
      if (typeof value !== 'undefined') {
        newObject[i] = value;
      }
    }
  }
  return newObject;
}

export {
  AuthError,
  getBaseUrl,
  getBasicAuthHeaders,
  getConfigUrl,
  getSessionUrl,
  getUsersUrl,
  wrapError,
  axios,
  clone
};
