import { AuthError, getBaseUrl, getBasicAuthHeaders, getConfigUrl, axios } from './utils';

function getMembership(opts) {
  var db = this;
  if (!opts) {
    opts = {};
  }

  var url = getBaseUrl(db) + '/_membership';
  var ajaxOpts = Object.assign({
    method: 'GET',
    url: url,
    headers: getBasicAuthHeaders(db),
  }, opts.ajax || {});
  return axios(ajaxOpts)

  // ajaxCore(ajaxOpts, wrapError(callback));
};

function signUpAdmin(username, password, opts) {
  var db = this;

  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return Promise.reject(new AuthError('You must provide a username'));
  } else if (!password) {
    return Promise.reject(new AuthError('You must provide a password'));
  }
  if (!opts) {
    opts = {};
  }

  return db.getMembership(opts)
  .catch(function(error){
    if (error.error !== 'illegal_database_name') throw error;
    return error;
  })
  .then(function (membership) {
    var nodeName;
    if (membership instanceof Error) {
      // Some couchdb-1.x-like server
      nodeName = undefined;
    } else {
      // Some couchdb-2.x-like server
      nodeName = membership.all_nodes[0];
    }

    var configUrl = getConfigUrl(db, nodeName);
    var url = (opts.configUrl || configUrl) + '/admins/' + encodeURIComponent(username);
    var ajaxOpts = Object.assign({
      method: 'PUT',
      url: url,
      processData: false,
      headers: getBasicAuthHeaders(db),
      data: '"' + password + '"',
    }, opts.ajax || {});
    // ajaxCore(ajaxOpts, wrapError(callback));
    return axios(ajaxOpts)
  });
};

function deleteAdmin(username, opts) {
  var db = this;
  if (!opts) {
    opts = {};
  }
  if (['http', 'https'].indexOf(db.type()) === -1) {
    return Promise.reject(new AuthError('This plugin only works for the http/https adapter. ' +
      'So you should use new PouchDB("http://mysite.com:5984/mydb") instead.'));
  } else if (!username) {
    return Promise.reject(new AuthError('You must provide a username'));
  }

  return db.getMembership(opts)
  .catch(function(error){
    if (error.error !== 'illegal_database_name') throw error;
    return error;
  })
  .then(function (membership) {
    var nodeName;
    if (membership instanceof Error) {
      // Some couchdb-1.x-like server
      nodeName = undefined;
    } else {
      // Some couchdb-2.x-like server
      nodeName = membership.all_nodes[0];
    }

    var configUrl = getConfigUrl(db, nodeName);
    var url = (opts.configUrl || configUrl) + '/admins/' + encodeURIComponent(username);
    var ajaxOpts = Object.assign({
      method: 'DELETE',
      url: url,
      processData: false,
      headers: getBasicAuthHeaders(db),
    }, opts.ajax || {});
    // ajaxCore(ajaxOpts, wrapError(callback));
    return axios(ajaxOpts)
  });
};

export { getMembership, deleteAdmin, signUpAdmin };
