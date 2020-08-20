'use strict';
const execFile = require('./execFile');

module.exports = function sudo(command, ...args) {
  if (process.env.LOG_THROTTLE) {
    console.log('sudo', command, ...args);
  }
  return execFile('sudo', [command, ...args]);
};
