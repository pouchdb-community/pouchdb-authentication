'use strict';

import { AuthError, getSessionUrl, wrapError } from './utils';

import ajaxCore from 'pouchdb-ajax';
import { assign, toPromise } from 'pouchdb-utils';

var logIn = toPromise(function (username, password, opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = opts;
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return callback(new AuthError('this plugin only works for the http/https adapter'));
  }

  if (!username) {
    return callback(new AuthError('you must provide a username'));
  } else if (!password) {
    return callback(new AuthError('you must provide a password'));
  }

  var ajaxOpts = assign({
    method: 'POST',
    url: getSessionUrl(db),
    headers: {'Content-Type': 'application/json'},
    body: {name: username, password: password},
  }, opts.ajax || {});
  ajaxCore(ajaxOpts, wrapError(callback));
});

var logOut = toPromise(function (opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = opts;
    opts = {};
  }
  var ajaxOpts = assign({
    method: 'DELETE',
    url: getSessionUrl(db),
  }, opts.ajax || {});
  ajaxCore(ajaxOpts, wrapError(callback));
});

var getSession = toPromise(function (opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = opts;
    opts = {};
  }
  var url = getSessionUrl(db);

  var ajaxOpts = assign({
    method: 'GET',
    url: url,
  }, opts.ajax || {});
  ajaxCore(ajaxOpts, wrapError(callback));
});

export { logIn, logOut, getSession };
