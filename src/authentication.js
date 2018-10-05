'use strict';

import { AuthError, getBasicAuthHeaders, getSessionUrl, axios } from './utils';

function logIn(username, password, opts) {
  var db = this;
  if (!opts) {
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

  var ajaxOpts = Object.assign({
    method: 'POST',
    url: getSessionUrl(db),
    headers: Object.assign({'Content-Type': 'application/json'}, getBasicAuthHeaders(db)),
    data: {name: username, password: password},
  }, opts.ajax || {});
  // ajaxCore(ajaxOpts, wrapError(callback));
  return axios(ajaxOpts).then(res => {
    if (res.ok && opts.basicAuth !== false) {
      if (!db.__opts) {
        db.__opts = {};
      }
      db.__opts.auth = {username, password};
    }
    return res;
  });
}

function logOut(opts) {
  var db = this;
  if (!opts) {
    opts = {};
  }
  var ajaxOpts = Object.assign({
    method: 'DELETE',
    url: getSessionUrl(db),
    headers: getBasicAuthHeaders(db),
  }, opts.ajax || {});
  // ajaxCore(ajaxOpts, wrapError(callback));
  // let result;
  // try {
  //   result = await axios(ajaxOpts);
  // } catch (err) {
  //   if (err.status !== 401) throw err;
  // }
  // if (db.__opts && db.__opts.auth) db.__opts.auth = null;
  // return result;

  return axios(ajaxOpts)
  .catch(err => {
    if (err.status !== 401) {
      throw err;
    }
  })
  .then(res => {
    if (db.__opts && db.__opts.auth) {
      db.__opts.auth = null;
    }
    return res;
  });
}

function getSession(opts) {
  var db = this;
  if (!opts) {
    opts = {};
  }
  var url = getSessionUrl(db);

  var ajaxOpts = Object.assign({
    method: 'GET',
    url: url,
    headers: getBasicAuthHeaders(db),
  }, opts.ajax || {});
  // ajaxCore(ajaxOpts, wrapError(callback));
  return axios(ajaxOpts);
}

export { logIn, logOut, getSession };
