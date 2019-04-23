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
  async start(options = {}) {
    verify(options);

    switch (os.platform()) {
      case 'darwin': {
        if (options.localhost) {
          throw new Error(
            'Localhost on ' + os.platform() + ' not supported at the moment'
          );
        }

        return pfctl.start(options.up, options.down, options.rtt);
      }

      case 'linux': {
        if (options.localhost) {
          return localHostTc.start(options.rtt);
        } else {
          return tc.start(options.up, options.down, options.rtt);
        }
      }

      default:
        throw new Error('Platform ' + os.platform() + ' not supported');
    }
  },
  async stop(options = {}) {
    switch (os.platform()) {
      case 'darwin': {
        return pfctl.stop();
      }

      case 'linux': {
        if (options.localhost) {
          return localHostTc.stop();
        } else {
          return tc.stop();
        }
      }

      default:
        throw new Error('Platform ' + os.platform() + ' not supported');
    }
  }
};
