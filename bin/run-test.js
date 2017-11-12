#!/usr/bin/env node
'use strict';

var childProcess = require('child_process');

var binDir = 'node_modules/.bin/';

var client = process.env.CLIENT || 'phantom';

if (client === 'node') {
  npmRun('mocha', ['--ui', 'bdd', 'test/*']);
} else if (client === 'phantom') {
  npm(['install', '--no-save', 'phantomjs-prebuilt']);
  npmRun('zuul', ['--phantom', '--ui', 'mocha-bdd', 'test/*']);
} else if (client === 'local') {
  npmRun('zuul', ['--local', '9000', '--no-coverage', '--ui', 'mocha-bdd', 'test/*']);
}

function npm(args) {
  childProcess.spawnSync('npm', args, {
    env: process.env,
    stdio: 'inherit'
  });
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
