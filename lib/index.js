'use strict';

const os = require('os');
const pfctl = require('./pfctl');
const tc = require('./tc');
const localHostTc = require('./localHostTc');
const localHostPfctl = require('./localHostPfctl');

function verify(options) {
  if (options.localhost) {
    if (!Number.isInteger(options.rtt)) {
      throw new Error('You need to set rtt as an integer for localhost');
    }
  } else if (
    (options.up && !Number.isInteger(options.up)) ||
    (options.down && !Number.isInteger(options.down)) ||
    (options.rtt && !Number.isInteger(options.rtt))
  ) {
    throw new Error('Input values needs to be integers');
  } else if (!options.up && !options.down && !options.rtt && !options.stop) {
    throw new Error('You need to at least set one of up/down/rtt.');
  }
}

module.exports = {
  async start(options = {}) {
    verify(options);

    switch (os.platform()) {
      case 'darwin': {
        if (options.localhost) {
          return localHostPfctl.start(options.rtt);
        }
        return pfctl.start(
          options.up,
          options.down,
          options.rtt,
          options.packetLoss
        );
      }

      case 'linux': {
        if (options.localhost) {
          return localHostTc.start(options.rtt);
        } else {
          return tc.start(
            options.up,
            options.down,
            options.rtt,
            options.packetLoss
          );
        }
      }

      default:
        throw new Error('Platform ' + os.platform() + ' not supported');
    }
  },
  async stop(options = {}) {
    switch (os.platform()) {
      case 'darwin': {
        if (options.localhost) {
          return localHostPfctl.stop();
        } else {
          return pfctl.stop();
        }
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
