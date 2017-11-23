var http = require('http');
var utils = require('./utils');

function runServer(server, runTests) {

  return Promise.resolve().then(function () {
    if (!server) {
      return null;
    }

    var tmp = server.split(':');
    server = {
      name: tmp[0] || 'couchdb',
      version: tmp[1] || 'latest',
    };

    if (server.name === 'couchdb') {
      var dockerImage = 'apache/couchdb:' + server.version;

      return utils.dockerRun(dockerImage, ['5984:5984']);
    } else {
      console.log('Unknown SERVER $SERVER. Did you mean couchdb:latest?');
    }

    return null;
  }).then(function (handle) {
    return waitForCouch('http://localhost:5984/')
    .then(function () {
      console.log('\nExecuting add-cors-to-couchdb');
      return utils.npmRun('add-cors-to-couchdb');
    }).then(function () {
      return runTests();
    }).catch(function (exitCode) {
      return Promise.resolve().then(function () {
        if (handle) {
          return handle.destroy();
        }
      }).then(function () {
        process.exit(exitCode);
      });
    }).then(function () {
      if (handle) {
        return handle.destroy();
      }
    });
  });
}

function waitForCouch(url) {
  return new Promise(function (resolve) {
    var interval = setInterval(function () {
      var request = http.request(url, function (res) {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
      });
      request.on('error', function () {
        console.info('Waiting for CouchDB on ' + url);
      });
      request.end();
    }, 1000);
  });
}

module.exports = runServer;
