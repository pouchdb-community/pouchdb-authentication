var childProcess = require('child_process');
var karma = require('karma');
var Mocha = require('mocha');
var fs = require('fs');
var path = require('path');

function npmRun(bin, args, stdio) {
  return run('node_modules/.bin/' + bin, args, stdio);
}

function npmRunDaemon(bin, args, stdio) {
  return runDaemon('node_modules/.bin/' + bin, args, stdio);
}

function mochaRun(options, testDir) {
  return new Promise(function (resolve, reject) {
    var mocha = new Mocha(options);

    fs.readdirSync(testDir).filter(function (file) {
      return file.substr(-3) === '.js';
    }).forEach(function (file) {
      mocha.addFile(path.join(testDir, file));
    });

    mocha.run(function (failures) {
      if (!failures) {
        resolve();
      } else {
        reject(failures);
      }
    });
  });
}

function karmaRun(options) {
  return new Promise(function (resolve, reject) {
    var server = new karma.Server(options, function (exitCode) {
      if (exitCode === 0) {
        resolve();
      } else {
        reject(exitCode);
      }
    });
    server.start();
  });
}

function dockerRun(image, ports) {
  var name = image.replace('/', '-').replace(':', '-') + '-' + Date.now();

  var args = [];
  args.push('run');
  ports.forEach(function (port) {
    args.push('-p', port);
  });
  args.push('--name', name, '-d', image);

  console.log('\nStarting docker image \'' + image + '\'');
  return run('docker', args, 'ignore').then(function () {
    return {
      destroy: function () {
        console.log('\nStopping docker container');
        return run('docker', ['stop', name]).then(function () {
          console.log('\nRemoving docker container');
          return run('docker', ['rm', name]);
        });
      },
    };
  });
}

function run(bin, args, stdio) {
  return new Promise(function (resolve, reject) {
    var cmd = bin + (args ? ' ' + args.join(' ') : '');
    console.log('> ' + cmd);

    var testProcess = childProcess.spawn(bin, args, {
      env: process.env,
      stdio: stdio || 'inherit',
    });

    testProcess.on('close', function (code) {
      if (code === 0) {
        resolve();
      } else {
        reject(code);
      }
    });
  });
}


function runDaemon(bin, args, stdio) {
  var cmd = bin + (args ? ' ' + args.join(' ') : '');

  var daemonProcess = childProcess.spawn(bin, args, {
    env: process.env,
    stdio: stdio || 'ignore',
  });

  console.log('\nStarting daemon');
  console.log('> ' + cmd);
  return Promise.resolve().then(function () {
    return {
      destroy: function () {
        console.log('\nStopping daemon');
        daemonProcess.kill();
      },
    };
  });
}

module.exports = {
  npmRun,
  npmRunDaemon,
  dockerRun,
  karmaRun,
  mochaRun,
};
