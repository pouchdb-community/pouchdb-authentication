'use strict';

import { AuthError, getBasicAuthHeaders, getSessionUrl, fetchJSON, toCallback } from './utils';
import { assign } from 'pouchdb-utils';

export default function makeAuthenticationAPI(fetchFun) {

var logIn = toCallback(function (username, password, opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('this plugin only works for the http/https adapter'));
  }

  if (!username) {
    return Promise.reject(new AuthError('you must provide a username'));
  } else if (!password) {
    return Promise.reject(new AuthError('you must provide a password'));
  }

  var url = getSessionUrl(db);
  var ajaxOpts = assign({
    method: 'POST',
    headers: getBasicAuthHeaders(db),
    body: {name: username, password: password},
  }, opts.ajax || {});
  return fetchJSON(fetchFun, url, ajaxOpts);
});

var logOut = toCallback(function (opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }

  var url = getSessionUrl(db);
  var ajaxOpts = assign({
    method: 'DELETE',
    headers: getBasicAuthHeaders(db),
  }, opts.ajax || {});
  return fetchJSON(fetchFun, url, ajaxOpts);
});

var getSession = toCallback(function (opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }

  var url = getSessionUrl(db);
  var ajaxOpts = assign({
    method: 'GET',
    headers: getBasicAuthHeaders(db),
  }, opts.ajax || {});
  return fetchJSON(fetchFun, url, ajaxOpts);
});

return { logIn, logOut, getSession };

}
