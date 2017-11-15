'use strict';

import urlJoin from 'url-join';
import urlParse from 'url-parse';

function getBaseUrl(db) {
  if (typeof db.getUrl === 'function') { // pouchdb pre-6.0.0
    return urlParse(db.getUrl()).origin;
  } else if (db.__opts && db.__opts.prefix) { // PouchDB.defaults
    return db.__opts.prefix;
  } else { // pouchdb post-6.0.0
    return urlParse(db.name).origin;
  }
}

function getUsersUrl(db) {
  return urlJoin(getBaseUrl(db), '/_users');
}

function getSessionUrl(db) {
  return urlJoin(getBaseUrl(db), '/_session');
}

export { getSessionUrl, getUsersUrl };
