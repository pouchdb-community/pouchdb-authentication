/*jshint expr:true */
/* global sum */
'use strict';

var Pouch = require('pouchdb');
var Authentication = require('../');
Pouch.plugin(Authentication);
var chai = require('chai');
var should = chai.should();
require("mocha-as-promised")();
chai.use(require("chai-as-promised"));
var Promise = require('bluebird');
var all = Promise.all;
if (process.browser) {
  process.env.TEST_DB = 'testdb' + Math.random();
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


function tests(dbName) {

  beforeEach(function () {
    return new Pouch(dbName);
  });
  afterEach(function () {
    return Pouch.destroy(dbName);
  });

  describe('authentication', function () {
    it("Test basic authentication", function (done) {
      done();
    });
  });
}
