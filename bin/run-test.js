#!/usr/bin/env node
'use strict';

var childProcess = require('child_process');
var karma = require('karma');

var binDir = 'node_modules/.bin/';

var client = process.env.CLIENT || 'phantom';

if (client === 'node') {
  npmRun('mocha', ['--ui', 'bdd', 'test/*']);
} else {
  var browsers = {
    'phantom': ['PhantomJS'],
    'local': []
  }[client];

  var server = new karma.Server({
    basePath: '',
    frameworks: ['mocha', 'chai', 'browserify'],
    files: [
      'test/**/*.js'
    ],
    preprocessors: {
      'test/**/*.js': ['browserify']
    },
    browserify: {
      debug: true,
      transform: ['brfs']
    },
    browsers: browsers,
    phantomJsLauncher: {
      exitOnResourceError: true
    },
    port: 9876,
    colors: true,
    reporters: ['mocha'],
    concurrency: 1,
    singleRun: client !== 'local'
  });
  server.start();
}

function npmRun(bin, args) {
  var testProcess = childProcess.spawn(binDir + bin, args, {
    env: process.env,
    stdio: 'inherit'
  });

  testProcess.on('close', function (code) {
    process.exit(code);
  });
}
