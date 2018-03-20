'use strict';

const os = require('os');
const pfctl = require('./pfctl');
const tc = require('./tc');
const localHostTc = require('./localHostTc');

function verify(options) {
  if (options.localhost) {
    if (!Number.isInteger(options.rtt)) {
      throw new Error('You need to set rtt as an integer for localhost');
    }
  } else if (
    !Number.isInteger(options.up) ||
    !Number.isInteger(options.down) ||
    !Number.isInteger(options.rtt)
  ) {
    throw new Error('Input values needs to be integers');
  }
}

module.exports = {
  start(options) {
    try {
      verify(options);
    } catch (e) {
      return Promise.reject(e);
    }

    if (os.platform() === 'darwin') {
      if (options.localhost) {
        return Promise.reject(
          new Error(
            'Localhost on ' + os.platform() + ' not supported at the moment'
          )
        );
      } else {
        return pfctl.start(options.up, options.down, options.rtt);
      }
    } else if (os.platform() === 'linux') {
      if (options.localhost) {
        return localHostTc.start(options.rtt);
      } else {
        return tc.start(options.up, options.down, options.rtt);
      }
    } else {
      return Promise.reject(
        new Error('Platform ' + os.platform() + ' not supported')
      );
    }
  },
  stop(options) {
    if (os.platform() === 'darwin') {
      return pfctl.stop();
    } else if (os.platform() === 'linux') {
      if (options.localhost) {
        return localHostTc.stop();
      } else {
        return tc.stop();
      }
    } else {
      return Promise.reject(
        new Error('Platform ' + os.platform() + ' not supported')
      );
    }
  }
};
