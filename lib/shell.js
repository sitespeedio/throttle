'use strict';
const execFile = require('./execFile');

module.exports = function shell(command) {
  if (process.env.LOG_THROTTLE) {
    console.log(command);
  }
  return execFile(command, { shell: true });
};
