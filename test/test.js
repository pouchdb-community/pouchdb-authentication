/*jshint expr:true */
/* global sum */
'use strict';

var PouchDB = require('pouchdb');
var Authentication = require('../');
PouchDB.plugin(Authentication);
var utils = require('../utils');
var chai = require('chai');
var should = chai.should();
require('mocha-as-promised')();
chai.use(require('chai-as-promised'));
var Promise = require('bluebird');
var all = Promise.all;
if (process.browser) {
  process.env.TEST_DB = 'http://localhost:5984/testdb';
}
var dbs = process.env.TEST_DB;
if (!dbs) {
  console.error('No db name specified');
  process.exit(1);
}
dbs.split(',').forEach(function (db) {
  var dbType = /^http/.test(db) ? 'http' : 'local';
  describe(dbType, function () {
    tests(db);
  });
});

var users = ['batman', 'superman', 'green_lantern', 'robin'];

function tests(dbName) {

  describe('authentication', function () {

    var db;

    beforeEach(function () {
      db = new PouchDB(dbName);
      return db;
    });
    afterEach(function () {
      return PouchDB.destroy(dbName).then(function () {
        var usersUrl = utils.getUsersUrl(dbName);
        return new PouchDB(usersUrl).then(function (usersDb) {
          // remove the fake users, hopefully we're in the admin party
          return usersDb.allDocs({
            include_docs : true,
            keys : users.map(function (user) {
              return 'org.apache.couchdb:' + user;
            })
          }).then(function (rows) {
            rows = rows.filter(function (row) {
              return row.doc;
            });
            var docs = rows.forEach(function (row) {
              row.doc._deleted = true;
              return row.doc;
            });
            return db.bulkDocs({docs : docs});
          });
        });
      });
    });

    it('Test signup', function () {
      return db.signup('batman', 'brucewayne').then(function (res) {
        res.ok.should.equal(true);
        res.id.should.equal('org.apache.couchdb:batman');
      });
    });

    it('Test signup conflict', function () {
      return db.signup('superman', 'clarkkent').then(function (res) {
        res.ok.should.equal(true);
        return db.signup('superman', 'notclarkkent').then(function (res) {
          should.not.exist(res);
        }).catch(function (err) {
          err.name.should.equal('conflict');
        });
      });
    });
    
    it('Test bad signup args', function () {
      return db.signup().catch(function (err) {
        should.exist(err);
      });
    });

    it('Test bad signup args 2', function () {
      return db.signup('green_lantern').catch(function (err) {
        should.exist(err);
      });
    });

    it('Test metadata', function () {
      var metadata = {alias : 'boywonder', profession : 'acrobat'};
      return db.signup('robin', 'dickgrayson', metadata).then(function (res) {
        res.ok.should.be(true);
        return db.getSession();
      }).then(function (session) {
        session.userCtx.name.should.equal('robin');
        session.userCtx.alias.should.equal('boywonder');
        session.userCtx.profession.should.equal('acrobat');
      });
    });
  });
}