var childProcess = require('child_process');
var karma = require('karma');

function npmRun(bin, args) {
  return run('node_modules/.bin/' + bin, args, 'inherit');
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
      stdio: stdio,
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

module.exports = {
  npmRun,
  dockerRun,
  karmaRun,
};
