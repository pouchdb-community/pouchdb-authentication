'use strict';

import { AuthError, getBasicAuthHeaders, getUsersUrl, fetchJSON, toCallback } from './utils';
import { assign, clone } from 'pouchdb-utils';

export default function makeUsersAPI(fetchFun) {

var getUsersDatabaseUrl = function () {
  var db = this;
  return getUsersUrl(db);
};

function updateUser(db, user, opts) {
  var reservedWords = [
    '_id',
    '_rev',
    'name',
    'type',
    'roles',
    'password',
    'password_scheme',
    'iterations',
    'derived_key',
    'salt',
  ];

  if (opts.metadata) {
    for (var key in opts.metadata) {
      if (opts.metadata.hasOwnProperty(key) && reservedWords.indexOf(key) !== -1) {
        return Promise.reject(new AuthError('cannot use reserved word in metadata: "' + key + '"'));
      }
    }
    user = assign(user, opts.metadata);
  }

  if (opts.roles) {
    user = assign(user, {roles: opts.roles});
  }
  var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id);
  var ajaxOpts = assign({
    method: 'PUT',
    body: user,
    headers: getBasicAuthHeaders(db),
  }, opts.ajax || {});

  return fetchJSON(fetchFun, url, ajaxOpts);
}

var signUp = toCallback(function (username, password, opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return Promise.reject(new AuthError('You must provide a username'));
  } else if (!password) {
    return Promise.reject(new AuthError('You must provide a password'));
  }

  var userId = 'org.couchdb.user:' + username;
  var user = {
    name: username,
    password: password,
    roles: [],
    type: 'user',
    _id: userId,
  };

  return updateUser(db, user, opts);
});

var getUser = toCallback(function (username, opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }
  if (!username) {
    return Promise.reject(new AuthError('you must provide a username'));
  }

  var url = getUsersUrl(db) + '/' + encodeURIComponent('org.couchdb.user:' + username);
  var ajaxOpts = assign({
    method: 'GET',
    headers: getBasicAuthHeaders(db),
  }, opts.ajax || {});

  return fetchJSON(fetchFun, url, ajaxOpts);
});

var putUser = toCallback(function (username, opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return Promise.reject(new AuthError('You must provide a username'));
  }

  return db.getUser(username, opts).then(user => updateUser(db, user, opts));
});

var deleteUser = toCallback(function (username, opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return Promise.reject(new AuthError('You must provide a username'));
  }

  return db.getUser(username, opts).then(user => {
    var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id) + '?rev=' + user._rev;
    var ajaxOpts = assign({
      method: 'DELETE',
      headers: getBasicAuthHeaders(db),
    }, opts.ajax || {});
    return fetchJSON(fetchFun, url, ajaxOpts);
  });
});

var changePassword = toCallback(function (username, password, opts) {
  var db = this;
  if (typeof opts === 'undefined') {
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return Promise.reject(new AuthError('You must provide a username'));
  } else if (!password) {
    return Promise.reject(new AuthError('You must provide a password'));
  }

  return db.getUser(username, opts).then(user => {
    user.password = password;

    var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id);
    var ajaxOpts = assign({
      method: 'PUT',
      headers: getBasicAuthHeaders(db),
      body: user,
    }, opts.ajax || {});

    return fetchJSON(fetchFun, url, ajaxOpts);
  });
});

var changeUsername = toCallback(function (oldUsername, newUsername, opts) {
  var db = this;
  var USERNAME_PREFIX = 'org.couchdb.user:';
  var updateUser = function (user, opts) {
    var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id);
    var updateOpts = assign({
      method: 'PUT',
      headers: getBasicAuthHeaders(db),
      body: user,
    }, opts.ajax);
    return fetchJSON(fetchFun, url, updateOpts);
  };
  if (typeof opts === 'undefined') {
    opts = {};
  }
  opts.ajax = opts.ajax || {};
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  }
  if (!newUsername) {
    return Promise.reject(new AuthError('You must provide a new username'));
  }
  if (!oldUsername) {
    return Promise.reject(new AuthError('You must provide a username to rename'));
  }

  return db.getUser(newUsername, opts)
  .then(function () {
    var error = new AuthError('user already exists');
    error.taken = true;
    throw error;
  }, function () {
    return db.getUser(oldUsername, opts);
  })
  .then(function (user) {
    var newUser = clone(user);
    delete newUser._rev;
    newUser._id = USERNAME_PREFIX + newUsername;
    newUser.name = newUsername;
    newUser.roles = opts.roles || user.roles || {};
    return updateUser(newUser, opts).then(function () {
      user._deleted = true;
      return updateUser(user, opts);
    });
  });
});

return {
  getUsersDatabaseUrl,
  signUp,
  getUser,
  putUser,
  deleteUser,
  changePassword,
  changeUsername,
};

}
