'use strict';

var Promise = typeof global.Promise === 'function' ? global.Promise : require('lie');
var utils = require('./utils');

exports.signup = function (username, password, opts, callback) {

  var db = this;
  var PouchDB = db.constructor;
  var pouchUtils = PouchDB.utils;
  return PouchDB.utils.toPromise(function (username, password, opts, callback) {
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

    db.info(function (err, info) {
      if (err) {
        return callback(err);
      }
      var url = utils.getHost(pouchUtils, info.db_name) + '/_users/' + encodeURIComponent(userId);

      db.request({
        method : 'PUT',
        url : url,
        body : user
      }, callback);
    });
  });
};

exports.signUp = exports.signup;

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