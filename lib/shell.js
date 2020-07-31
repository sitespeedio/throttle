'use strict';
const execa = require('execa');

module.exports = function shell(command) {
  if (process.env.LOG_THROTTLE) {
    console.log(command);
  }
  return execa(command);
};
