'use strict';

var PouchDB = require('pouchdb-memory');
var Authentication = require('../lib');
PouchDB.plugin(Authentication);
var chai = require('chai');
var should = chai.should();
chai.use(require('chai-as-promised'));

var users = ['aquaman'];

describe('authentication', function () {

  var dbName = 'http://localhost:5984/testdb';

  var db;

  beforeEach(function () {
    db = new PouchDB(dbName);
    return db;
  });
  afterEach(function () {
    return db.logout().then(function () {
      return db.destroy().then(function () {
        var usersUrl = db.getUsersDatabaseUrl();
        var usersDb = new PouchDB(usersUrl);
        // remove the fake users, hopefully we're in the admin party
        return usersDb.allDocs({
          include_docs: true,
          keys: users.map(function (user) {
            return 'org.couchdb.user:' + user;
          })
        }).then(function (res) {
          var rows = res.rows.filter(function (row) {
            return row.doc;
          });
          var docs = rows.map(function (row) {
            row.doc._deleted = true;
            return row.doc;
          });
          return usersDb.bulkDocs({docs: docs});
        });
      });
    });
  });

  it('Test login/logout', function () {
    return db.signup('aquaman', 'sleeps_with_fishes').then(function () {
      return db.getSession();
    }).then(function (res) {
      should.equal(res.userCtx.name, null);
      return db.login('aquaman', 'sleeps_with_fishes');
    }).then(function (res) {
      res.ok.should.equal(true);
      return db.getSession();
    }).then(function (res) {
      res.userCtx.name.should.equal('aquaman');
      return db.logout();
    }).then(function () {
      return db.getSession();
    }).then(function (res) {
      should.equal(res.userCtx.name, null);
    });
  });
});
