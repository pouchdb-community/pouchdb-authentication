'use strict';

import { AuthError, getBasicAuthHeaders, getUsersUrl, axios, clone } from './utils';

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
    user = Object.assign(user, opts.metadata);
  }

  if (opts.roles) {
    user = Object.assign(user, {roles: opts.roles});
  }

  var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id);
  var ajaxOpts = Object.assign({
    method: 'PUT',
    url: url,
    data: user,
    headers: getBasicAuthHeaders(db),
  }, opts.ajax || {});
  // ajaxCore(ajaxOpts, wrapError(callback));
  return axios(ajaxOpts);
}

function signUp(username, password, opts) {
  var db = this;
  if (!opts) {
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
}

function getUser(username, opts) {
  var db = this;
  if (!opts) {
    opts = {};
  }
  if (!username) {
    return Promise.reject(new AuthError('you must provide a username'));
  }

  var url = getUsersUrl(db);
  var ajaxOpts = Object.assign({
    method: 'GET',
    url: url + '/' + encodeURIComponent('org.couchdb.user:' + username),
    headers: getBasicAuthHeaders(db),
  }, opts.ajax || {});
  // ajaxCore(ajaxOpts, wrapError(callback));
  return axios(ajaxOpts);
}

function putUser(username, opts) {
  var db = this;
  if (!opts) {
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return Promise.reject(new AuthError('You must provide a username'));
  }

  return db.getUser(username, opts).then(function (user) {
    return updateUser(db, user, opts);
  });
}

function deleteUser(username, opts) {
  var db = this;
  if (!opts) {
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return Promise.reject(new AuthError('You must provide a username'));
  }

  return db.getUser(username, opts).then(function (user) {
    var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id) + '?rev=' + user._rev;
    var ajaxOpts = Object.assign({
      method: 'DELETE',
      url: url,
      headers: getBasicAuthHeaders(db),
    }, opts.ajax || {});
    // ajaxCore(ajaxOpts, wrapError(callback));
    return axios(ajaxOpts);
  });
}

function changePassword(username, password, opts) {
  var db = this;
  if (!opts) {
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

  return db.getUser(username, opts).then(function (user) {
    user.password = password;

    var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id);
    var ajaxOpts = Object.assign({
      method: 'PUT',
      url: url,
      headers: getBasicAuthHeaders(db),
      data: user,
    }, opts.ajax || {});
    // ajaxCore(ajaxOpts, wrapError(callback));
    return axios(ajaxOpts);
  });
}

function changeUsername(oldUsername, newUsername, opts) {
  var db = this;
  var USERNAME_PREFIX = 'org.couchdb.user:';
  var updateUser = function (user, opts) {
    var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id);
    var updateOpts = Object.assign({
      method: 'PUT',
      url: url,
      headers: getBasicAuthHeaders(db),
      data: user,
    }, opts.ajax);
    return axios(updateOpts);
  };
  if (!opts) {
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
  // .then(function (res) {
  //   callback(null, res);
  // })
  // .catch(callback);
}

export {
  getUsersDatabaseUrl,
  signUp,
  getUser,
  putUser,
  deleteUser,
  changePassword,
  changeUsername,
};
