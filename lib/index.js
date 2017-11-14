'use strict';

var utils = require('./utils');

var Promise = require('pouchdb-promise');
var pouchdbAjax = require('pouchdb-ajax');
var pouchdbUtils = require('pouchdb-utils');

var inherits = require('inherits');

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
    'password',
    'roles',
    'type',
    'salt',
    'derived_key',
    'password_scheme',
    'iterations'
  ];

  if (opts.metadata) {
    for (var key in opts.metadata) {
      if (reservedWords.indexOf(key) !== -1) {
        return callback(new AuthError('cannot use reserved word in metadata: "' + key + '"'));
      }
    }
    user = pouchdbUtils.assign(user, opts.metadata);
  }

  var url = utils.getUsersUrl(db) + '/' + encodeURIComponent(user._id);
  var ajaxOpts = pouchdbUtils.assign({
    method : 'PUT',
    url : url,
    body : user
  }, opts.ajax || {});
  pouchdbAjax(ajaxOpts, wrapError(callback));
}

exports.signup = pouchdbUtils.toPromise(function (username, password, opts, callback) {
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
    roles    : opts.roles || [],
    type     : 'user',
    _id      : userId
  };

  putUser(db, user, opts, callback);
});

exports.signUp = exports.signup;

exports.login = pouchdbUtils.toPromise(function (username, password, opts, callback) {
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

  var ajaxOpts = pouchdbUtils.assign({
    method : 'POST',
    url : utils.getSessionUrl(db),
    headers : {'Content-Type': 'application/json'},
    body : JSON.stringify({name: username, password: password})
  }, opts.ajax || {});
  pouchdbAjax(ajaxOpts, wrapError(callback));
});

exports.logIn = exports.login;

exports.logout = pouchdbUtils.toPromise(function (opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = opts;
    opts = {};
  }
  var ajaxOpts = pouchdbUtils.assign({
    method : 'DELETE',
    url : utils.getSessionUrl(db)
  }, opts.ajax || {});
  pouchdbAjax(ajaxOpts, wrapError(callback));
});

exports.logOut = exports.logout;

exports.getSession = pouchdbUtils.toPromise(function (opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = opts;
    opts = {};
  }
  var url = utils.getSessionUrl(db);

  var ajaxOpts = pouchdbUtils.assign({
    method : 'GET',
    url : url
  }, opts.ajax || {});
  pouchdbAjax(ajaxOpts, wrapError(callback));
});

exports.getUser = pouchdbUtils.toPromise(function (username, opts, callback) {
  var db = this;
  if (typeof callback === 'undefined') {
    callback = typeof opts === 'undefined' ? username : opts;
    opts = {};
  }
  if (!username) {
    return callback(new AuthError('you must provide a username'));
  }

  var url = utils.getUsersUrl(db);
  var ajaxOpts = pouchdbUtils.assign({
    method : 'GET',
    url : url + '/' + encodeURIComponent('org.couchdb.user:' + username)
  }, opts.ajax || {});
  pouchdbAjax(ajaxOpts, wrapError(callback));
});

exports.putUser = pouchdbUtils.toPromise(function (username, opts, callback) {
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

exports.changePassword = pouchdbUtils.toPromise(function (username, password, opts, callback) {
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

    var url = utils.getUsersUrl(db) + '/' + encodeURIComponent(user._id);
    var ajaxOpts = pouchdbUtils.assign({
      method : 'PUT',
      url : url,
      body : user
    }, opts.ajax || {});
    pouchdbAjax(ajaxOpts, wrapError(callback));
  });
});

exports.changeUsername =
    pouchdbUtils.toPromise(function (oldUsername, newUsername, opts, callback) {
  var db = this;
  var USERNAME_PREFIX = 'org.couchdb.user:';
  var ajax = function (opts) {
    return new Promise(function (resolve, reject) {
      pouchdbAjax(opts, wrapError(function (err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      }));
    });
  };
  var updateUser = function (user, opts) {
    var url = utils.getUsersUrl(db) + '/' + encodeURIComponent(user._id);
    var updateOpts = pouchdbUtils.assign({
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
    var newUser = pouchdbUtils.clone(user);
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
