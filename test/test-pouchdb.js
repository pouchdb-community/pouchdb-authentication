module.exports = typeof window !== 'undefined' ?
  require('pouchdb-browser') : require('pouchdb-node');
