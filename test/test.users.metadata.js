'use strict';

var PouchDB = require('pouchdb-memory');
var Authentication = require('../lib');
PouchDB.plugin(Authentication);
var chai = require('chai');
var should = chai.should();
chai.use(require('chai-as-promised'));

var users = ['robin'];

describe('users.metadata', function () {

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

  it('Test metadata', function () {
    var metadata = {alias: 'boywonder', profession: 'acrobat'};
    var opts = {metadata: metadata};
    return db.signup('robin', 'dickgrayson', opts).then(function (res) {
      res.ok.should.equal(true);
      return db.login('robin', 'dickgrayson');
    }).then(function () {
      return db.getUser('robin');
    }).then(function (user) {
      user.name.should.equal('robin');
      user.alias.should.equal('boywonder');
      user.profession.should.equal('acrobat');
    });
  });

  it('Test changing metadata', function () {
    var metadata = {alias: 'boywonder', profession: 'acrobat'};
    var newMetadata = {alias: 'rednowyob', profession: 'taborca'};
    var opts = {metadata: metadata};
    return db.signup('robin', 'dickgrayson', opts).then(function (res) {
      res.ok.should.equal(true);
      return db.login('robin', 'dickgrayson');
    }).then(function () {
      return db.getUser('robin');
    }).then(function (user) {
      user.name.should.equal('robin');
      user.alias.should.equal('boywonder');
      user.profession.should.equal('acrobat');
    }).then(function () {
      return db.putUser('robin', {metadata: newMetadata});
    }).then(function () {
      return db.getUser('robin');
    }).then(function (user) {
      user.name.should.equal('robin');
      user.alias.should.equal('rednowyob');
      user.profession.should.equal('taborca');
    });
  });

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

  reservedWords.forEach(function (key) {
    it('Test changing metadata using reserved word "' + key + '"', function () {
      return db.signup('robin', 'dickgrayson').then(function (res) {
        res.ok.should.equal(true);
        return db.login('robin', 'dickgrayson');
      }).then(function () {
        return db.getUser('robin').then(function (user) {
          var metadata = {};
          metadata[key] = 'test';
          return db.putUser('robin', {metadata: metadata}).then(function (res) {
            res.ok.should.not.equal(true);
          }).catch(function (err) {
            should.exist(err);
            err.status.should.equal(400);
            err.name.should.equal('authentication_error');
            err.message.should.equal('cannot use reserved word in metadata: "' + key + '"');
            err.error.should.equal(true);

            if (key === 'password') {
              return db.login('robin', 'dickgrayson').then(function (res) {
                res.ok.should.equal(true);
              }).catch(function (err) {
                should.not.exist(err);
              });
            } else {
              return db.getUser('robin').then(function (changedUser) {
                changedUser[key].should.deep.equal(user[key]);
              }).catch(function (err) {
                should.not.exist(err);
              });
            }
          });
        });
      });
    });
  });

  it('Test changing metadata using non-reserved word "metadata"', function () {
    var metadata = {test: 'test'};
    return db.signup('robin', 'dickgrayson').then(function (res) {
      res.ok.should.equal(true);
      return db.login('robin', 'dickgrayson');
    }).then(function () {
      return db.putUser('robin', {metadata: {metadata: metadata}});
    }).then(function (res) {
      res.ok.should.equal(true);
      return db.getUser('robin');
    }).then(function (changedUser) {
      changedUser.metadata.should.deep.equal(metadata);
    }).catch(function (err) {
      should.not.exist(err);
    });
  });
});
