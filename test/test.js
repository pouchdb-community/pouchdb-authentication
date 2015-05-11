/*jshint expr:true */
/* global sum */
'use strict';

var PouchDB = require('pouchdb');
var Authentication = require('../lib');
PouchDB.plugin(Authentication);
var utils = require('../lib/utils');
var chai = require('chai');
var should = chai.should();
require('mocha-as-promised')();
chai.use(require('chai-as-promised'));
var Promise = require('bluebird');
var all = Promise.all;
if (process.browser) {
  process.env.TEST_DB = 'http://localhost:2022/testdb';
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

var users = ['batman', 'superman', 'green_lantern', 'robin', 'aquaman', 'spiderman'];

function tests(dbName) {

  describe('authentication', function () {

    var db;

    beforeEach(function () {
      db = new PouchDB(dbName);
      return db;
    });
    afterEach(function () {
      return db.logout().then(function () {
        return PouchDB.destroy(dbName).then(function () {
          var usersUrl = utils.getUsersUrl(db);
          return new PouchDB(usersUrl).then(function (usersDb) {
            // remove the fake users, hopefully we're in the admin party
            return usersDb.allDocs({
              include_docs : true,
              keys : users.map(function (user) {
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
              return usersDb.bulkDocs({docs : docs});
            });
          });
        });
      });
    });

    it('Test signup', function () {
      return db.signup('batman', 'brucewayne').then(function (res) {
        console.log(res);
        res.ok.should.equal(true);
        res.id.should.equal('org.couchdb.user:batman');
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

    it('Test login/logout', function () {
      return db.signup('aquaman', 'sleeps_with_fishes').then(function (res) {
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

    it('Test metadata', function () {
      var metadata = {alias : 'boywonder', profession : 'acrobat'};
      var opts = {metadata : metadata};
      return db.signup('robin', 'dickgrayson', opts).then(function (res) {
        res.ok.should.equal(true);
        return db.login('robin', 'dickgrayson');
      }).then(function () {
        return db.getUser('robin');
      }).then(function (user) {
        console.log(user);
        user.name.should.equal('robin');
        user.alias.should.equal('boywonder');
        user.profession.should.equal('acrobat');
      });
    });

    it('Test wrong user for getUser', function () {
      return db.signup('robin', 'dickgrayson').then(function (res) {
        return db.signup('aquaman', 'sleeps_with_fishes');
      }).then(function () {
        return db.login('robin', 'dickgrayson');
      }).then(function () {
        return db.getUser('robin');
      }).then(function (res) {
        res.name.should.equal('robin');
        return db.getUser('aquaman').then(function (res) {
          should.not.exist(res);
        }).catch(function (err) {
          err.name.should.equal('not_found');
          return db.login('aquaman', 'sleeps_with_fishes').then(function () {
            return db.getUser('aquaman').then(function (res) {
              res.name.should.equal('aquaman');
              return db.getSession();
            }).then(function (res) {
              res.userCtx.name.should.equal('aquaman');
              return db.getUser('robin').then(function (res) {
                should.not.exist(res);
              }).catch(function (err) {
                err.name.should.equal('not_found');
              });
            });
          });
        });
      });
    });

    it('Test change password', function () {
      return db.signup('spiderman', 'will-forget').then(function (res) {
        return db.changePassword('spiderman', 'will-remember').then(function (res) {
          res.ok.should.equal(true);
        }).then(function () {
          return db.login('spiderman', 'will-remember');
        }).then(function (res) {
          res.ok.should.equal(true);
        });
      });
    });
  });
}
