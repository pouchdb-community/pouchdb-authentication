'use strict';

import urlJoin from 'url-join';

function getBaseUrl(db) {
  if (typeof db.getUrl === 'function') { // pouchdb pre-6.0.0
    return db.getUrl().replace(/[^/]+\/?$/, '');
  } else if (db.__opts && db.__opts.prefix) { // PouchDB.defaults
    return db.__opts.prefix;
  } else { // pouchdb post-6.0.0
    return db.name.replace(/[^/]+\/?$/, '');
  }
}

function getUsersUrl(db) {
  return urlJoin(getBaseUrl(db), '/_users');
}

function getSessionUrl(db) {
  return urlJoin(getBaseUrl(db), '/_session');
}

export { getSessionUrl, getUsersUrl };
