'use strict';

var utils = require('./utils');

exports.signup = utils.toPromise(function (username, password, opts, callback) {
  var db = this;
  var PouchDB = db.constructor;
  var pouchUtils = PouchDB.utils;
  if (typeof callback === 'undefined') {
    callback = typeof opts === 'undefined' ? (typeof password === 'undefined' ?
      username : password) : opts;
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return callback(new AuthError('this plugin only works for the http/https adapter'));
  } else if (!username) {
    return callback(new AuthError('you must provide a username'));
  } else if (!password) {
    return callback(new AuthError('you must provide a password'));
  }

  var userId = 'org.couchdb.user:' + username;
  var user = {
    name     : username,
    password : password,
    roles    : opts.roles || [],
    type     : 'user',
    _id      : userId
  };

  var reservedWords = ['name', 'password', 'roles', 'type'];
  if (opts.metadata) {
    for (var key in opts.metadata) {
      if (opts.hasOwnProperty(key)) {
        if (reservedWords.indexOf(key) !== -1 || key.startsWith('_')) {
          return callback(new AuthError('cannot use reserved word in metadata: "' + key + '"'));
        }
      }
    }
    user = pouchUtils.extend(true, user, opts.metadata);
  }

  var url = utils.getUsersUrl(db) + '/' + encodeURIComponent(userId);
  pouchUtils.ajax({
    method : 'PUT',
    url : url,
    body : user
  }, callback);
});

exports.signUp = exports.signup;

exports.login = utils.toPromise(function (username, password, opts, callback) {
  var db = this;
  var PouchDB = db.constructor;
  var pouchUtils = PouchDB.utils;
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

  pouchUtils.ajax({
    method : 'POST',
    url : utils.getSessionUrl(db),
    body : {name : username, password : password}
  }, callback);
});

exports.logIn = exports.login;

exports.logout = utils.toPromise(function (opts, callback) {
  var db = this;
  var PouchDB = db.constructor;
  var pouchUtils = PouchDB.utils;
  if (typeof callback === 'undefined') {
    callback = opts;
    opts = {};
  }
  pouchUtils.ajax({
    method : 'DELETE',
    url : utils.getSessionUrl(db)
  }, callback);
});

exports.logOut = exports.logout;

exports.getSession = utils.toPromise(function (opts, callback) {
  var db = this;
  var PouchDB = db.constructor;
  var pouchUtils = PouchDB.utils;
  if (typeof callback === 'undefined') {
    callback = opts;
    opts = {};
  }
  var url = utils.getSessionUrl(db);

  pouchUtils.ajax({
    method : 'GET',
    url : url
  }, callback);
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

utils.inherits(AuthError, Error);