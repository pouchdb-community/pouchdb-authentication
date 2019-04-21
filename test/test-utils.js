var PouchDB = require('pouchdb-browser');

module.exports.getConfig = function () {
  return typeof window !== 'undefined' ? window.__karma__.config : global.__testConfig__;
};

module.exports.ensureUsersDatabaseExists = function (db) {
  var usersUrl = db.getUsersDatabaseUrl();
  var usersDb = new PouchDB(usersUrl);
  return usersDb.info();
};

module.exports.deleteUsers = function (db, users) {
  var usersUrl = db.getUsersDatabaseUrl();
  var usersDb = new PouchDB(usersUrl);
  return usersDb.allDocs({
    include_docs: true,
    keys: users.map(function (user) {
      return 'org.couchdb.user:' + user;
    }),
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
};
