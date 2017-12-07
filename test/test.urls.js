'use strict';

var PouchDB = require('pouchdb-memory');
var Authentication = require('../lib');
PouchDB.plugin(Authentication);

var utils = require('./test-utils');
var chai = require('chai');
chai.should();

var serverHost = utils.getConfig().serverHost;

describe('urls', function () {

  var hostUrl = serverHost;
  var dbName = 'testdb';
  var dbUrl = hostUrl + '/' + dbName;

  it('Correct users database url for database without trailing slash', function () {
    var db = new PouchDB(dbUrl);
    var usersUrl = db.getUsersDatabaseUrl();
    usersUrl.should.equal(hostUrl + '/_users');
  });

  it('Correct users database url for database with trailing slash', function () {
    var db = new PouchDB(dbUrl + '/');
    var usersUrl = db.getUsersDatabaseUrl();
    usersUrl.should.equal(hostUrl + '/_users');
  });

  it('Correct users database url using prefix without trailing slash', function () {
    var PouchWithPrefix = PouchDB.defaults({prefix: hostUrl});
    var db = new PouchWithPrefix(dbName);
    var usersUrl = db.getUsersDatabaseUrl();
    usersUrl.should.equal(hostUrl + '/_users');
  });

  it('Correct users database url using prefix with trailing slash', function () {
    var PouchWithPrefix = PouchDB.defaults({prefix: hostUrl + '/'});
    var db = new PouchWithPrefix(dbName);
    var usersUrl = db.getUsersDatabaseUrl();
    usersUrl.should.equal(hostUrl + '/_users');
  });

  it('Correct users database url for cloudant-style database urls', function () {
    var db = new PouchDB(hostUrl + '/');
    var usersUrl = db.getUsersDatabaseUrl();
    usersUrl.should.equal(hostUrl + '/_users');
  });
});
