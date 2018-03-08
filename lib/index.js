'use strict';

const os = require('os');
const pfctl = require('./pfctl');
const tc = require('./tc');
const localHostTc = require('./localHostTc');
const hasbin = require('hasbin');

function verify(options) {
  if (options.localhost) {
    if (!Number.isInteger(options.rtt)) {
      throw Error('You need to set rtt as an integer for localhost');
    }
  } else if (
    !Number.isInteger(options.up) ||
    !Number.isInteger(options.down) ||
    !Number.isInteger(options.rtt)
  ) {
    throw Error('Input values needs to be integers');
  }
}

module.exports = {
  start(options) {
    verify(options);

    if (os.platform() === 'darwin') {
      if (options.localhost) {
        throw Error(
          'Localhost on ' + os.platform() + ' not supported at the moment'
        );
      } else {
        if (hasbin.all.sync(['dnctl', 'pfctl'])) {
          return pfctl.start(options.up, options.down, options.rtt);
        } else throw Error('Missing dnctl or pfctl');
      }
    } else if (os.platform() === 'linux') {
      if (options.localhost) {
        if (hasbin.all.sync(['tc'])) {
          return localHostTc.start(options.rtt);
        } else throw Error('Missing tc');
      } else {
        if (hasbin.all.sync(['tc', 'route', 'ip'])) {
          return tc.start(options.up, options.down, options.rtt);
        } else throw Error('Missing tc, route or ip');
      }
    } else {
      throw Error('Platform ' + os.platform() + ' not supported');
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
      throw Error('Platform ' + os.platform() + ' not supported');
    }
  }
};
