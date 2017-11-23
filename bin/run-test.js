#!/usr/bin/env node
'use strict';

var utils = require('./utils');
var runServer = require('./run-server');

var server = process.env.SERVER;
var client = process.env.CLIENT || 'phantom';

runServer(server, function () {
  return runTests(client);
});

function runTests(client) {
  if (client === 'node') {
    console.log('\nRunning mocha tests on Node.js');
    return utils.npmRun('mocha', ['--ui', 'bdd', 'test/*']);
  } else {
    var options = buildKarmaConf(client);

    // buildKarmaConf returns null if we can't run the tests
    // e.g. SauceLabs with no credentials on Travis
    if (!options) {
      return Promise.resolve();
    }

    return utils.karmaRun(options);
  }
}

function buildKarmaConf(client) {
  // Karma base configuration
  var options = {
    basePath: '',
    frameworks: ['mocha', 'chai', 'browserify'],
    files: [
      'test/**/*.js',
    ],
    preprocessors: {
      'test/**/*.js': ['browserify'],
    },
    browserify: {
      debug: true,
      transform: ['brfs'],
    },
    port: 9876,
    colors: true,
    reporters: ['mocha'],
    concurrency: 1,
    singleRun: client !== 'local',
  };

  if (client === 'phantom') {
    options.browsers = ['PhantomJS'];
    options.phantomJsLauncher = {
      exitOnResourceError: true,
    };
  } else if (client === 'local') {
    options.browsers = [];
  } else {
    var tmp = (client || 'saucelabs:firefox').split(':');
    client = {
      runner: tmp[0] || 'saucelabs',
      browser: tmp[1] || 'firefox',
      version: tmp[2] || null, // Latest
      platform: tmp[3] || null,
    };

    if (process.env.TRAVIS &&
      client.runner === 'saucelabs' &&
      process.env.TRAVIS_SECURE_ENV_VARS === 'false') {
      console.error('Not running test, cannot connect to saucelabs');
      return null;
    }

    if (client.runner === 'saucelabs') {

      // Standard SauceLabs configuration
      options.sauceLabs = {
        testName: 'pouchdb-authentication tests',
        connectOptions: {
          username: process.env.SAUCE_USERNAME,
          accessKey: process.env.SAUCE_ACCESS_KEY,
          tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER || 'tunnel-' + Date.now(),
        },
      };
      options.customLaunchers = {
        sl: {
          base: 'SauceLabs',
          browserName: client.browser,
          platform: client.platform,
          version: client.version,
        },
      };
      options.browsers = ['sl'];
      options.reporters.push('saucelabs');

      // Longer timeouts for SauceLabs
      options.captureTimeout = 2 * 60 * 1000;
      options.browserNoActivityTimeout = 30 * 60 * 1000;
      options.browserDisconnectTimeout = 30 * 60 * 1000;

      // To account for distance between SauceLabs and CouchDB at Travis
      options.client = {
        mocha: {
          timeout: 30 * 60 * 1000,
        },
      };
    }
  }

  return options;
}
