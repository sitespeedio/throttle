'use strict';

const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

module.exports = function shell(command, options) {
  return execFile(command, options);
};
