'use strict';

import { getSessionUrl, getUsersUrl } from './utils';

import Promise from 'pouchdb-promise';
import ajaxCore from 'pouchdb-ajax';
import { assign, clone, toPromise } from 'pouchdb-utils';

import inherits from 'inherits';

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

function putUser(db, user, opts, callback) {
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
    'salt'
  ];

  if (opts.metadata) {
    for (var key in opts.metadata) {
      if (opts.metadata.hasOwnProperty(key) && reservedWords.indexOf(key) !== -1) {
        return callback(new AuthError('cannot use reserved word in metadata: "' + key + '"'));
      }
    }
    user = assign(user, opts.metadata);
  }

  if (opts.roles) {
    user = assign(user, {roles: opts.roles});
  }

  var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id);
  var ajaxOpts = assign({
    method : 'PUT',
    url : url,
    body : user
  }, opts.ajax || {});
  ajaxCore(ajaxOpts, wrapError(callback));
}

var plugin = {};

plugin.getUsersDatabaseUrl = function () {
  var db = this;
  return getUsersUrl(db);
};

plugin.signup = toPromise(function (username, password, opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = typeof opts === 'undefined' ? (typeof password === 'undefined' ?
      username : password) : opts;
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return callback(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return callback(new AuthError('You must provide a username'));
  } else if (!password) {
    return callback(new AuthError('You must provide a password'));
  }

  var userId = 'org.couchdb.user:' + username;
  var user = {
    name     : username,
    password : password,
    roles    : [],
    type     : 'user',
    _id      : userId
  };

  putUser(db, user, opts, callback);
});

plugin.signUp = plugin.signup;

plugin.login = toPromise(function (username, password, opts, callback) {
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
    method : 'POST',
    url : getSessionUrl(db),
    headers : {'Content-Type': 'application/json'},
    body : JSON.stringify({name: username, password: password})
  }, opts.ajax || {});
  ajaxCore(ajaxOpts, wrapError(callback));
});

plugin.logIn = plugin.login;

plugin.logout = toPromise(function (opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = opts;
    opts = {};
  }
  var ajaxOpts = assign({
    method : 'DELETE',
    url : getSessionUrl(db)
  }, opts.ajax || {});
  ajaxCore(ajaxOpts, wrapError(callback));
});

plugin.logOut = plugin.logout;

plugin.getSession = toPromise(function (opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = opts;
    opts = {};
  }
  var url = getSessionUrl(db);

  var ajaxOpts = assign({
    method : 'GET',
    url : url
  }, opts.ajax || {});
  ajaxCore(ajaxOpts, wrapError(callback));
});

plugin.getUser = toPromise(function (username, opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = typeof opts === 'undefined' ? username : opts;
    opts = {};
  }
  if (!username) {
    return callback(new AuthError('you must provide a username'));
  }

  var url = getUsersUrl(db);
  var ajaxOpts = assign({
    method : 'GET',
    url : url + '/' + encodeURIComponent('org.couchdb.user:' + username)
  }, opts.ajax || {});
  ajaxCore(ajaxOpts, wrapError(callback));
});

plugin.putUser = toPromise(function (username, opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = typeof opts === 'undefined' ? username : opts;
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return callback(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return callback(new AuthError('You must provide a username'));
  }

  db.getUser(username, opts, function (error, user) {
    if (error) {
      return callback(error);
    }

    putUser(db, user, opts, callback);
  });
});

plugin.changePassword = toPromise(function (username, password, opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = typeof opts === 'undefined' ? (typeof password === 'undefined' ?
      username : password) : opts;
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return callback(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return callback(new AuthError('You must provide a username'));
  } else if (!password) {
    return callback(new AuthError('You must provide a password'));
  }

  db.getUser(username, opts, function (error, user) {
    if (error) {
      return callback(error);
    }

    user.password = password;

    var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id);
    var ajaxOpts = assign({
      method : 'PUT',
      url : url,
      body : user
    }, opts.ajax || {});
    ajaxCore(ajaxOpts, wrapError(callback));
  });
});

plugin.changeUsername = toPromise(function (oldUsername, newUsername, opts, callback) {
  var db = this;
  var USERNAME_PREFIX = 'org.couchdb.user:';
  var ajax = function (opts) {
    return new Promise(function (resolve, reject) {
      ajaxCore(opts, wrapError(function (err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      }));
    });
  };
  var updateUser = function (user, opts) {
    var url = getUsersUrl(db) + '/' + encodeURIComponent(user._id);
    var updateOpts = assign({
      method : 'PUT',
      url : url,
      body: user
    }, opts.ajax);
    return ajax(updateOpts);
  };
  if (typeof callback === 'undefined') {
    callback = opts;
    opts = {};
  }
  opts.ajax = opts.ajax || {};
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return callback(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  }
  if (!newUsername) {
    return callback(new AuthError('You must provide a new username'));
  }
  if (!oldUsername) {
    return callback(new AuthError('You must provide a username to rename'));
  }

  db.getUser(newUsername, opts)
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
  }).then(function (res) {
    callback(null, res);
  }).catch(callback);
});


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

if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}

export default plugin;
