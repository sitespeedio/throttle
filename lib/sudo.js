'use strict';
const execa = require('execa');

module.exports = function sudo(command, ...args) {
  if (process.env.LOG_THROTTLE) {
    console.log('sudo', command, ...args);
  }
  return execa('sudo', [command, ...args]);
};
