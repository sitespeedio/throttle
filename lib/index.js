import { platform } from 'node:os';
import { start as startPfctl, stop as stopPfctl } from './pfctl.js';
import { start as startTc, stop as stopTc } from './tc.js';
import {
  start as startTcLocalhost,
  stop as stopTcLocalhost
} from './localHostTc.js';
import {
  start as startPfctlLocalhost,
  stop as stopPfctlLocalhost
} from './localHostPfctl.js';

function verify(options) {
  if (options.localhost) {
    if (!Number.isInteger(options.rtt)) {
      throw new TypeError('You need to set rtt as an integer for localhost');
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

export async function start(options = {}) {
  verify(options);

  switch (platform()) {
    case 'darwin': {
      if (options.localhost) {
        return startPfctlLocalhost(options.rtt);
      }
      return startPfctl(
        options.up,
        options.down,
        options.rtt,
        options.packetLoss
      );
    }

    case 'linux': {
      return options.localhost
        ? startTcLocalhost(options.rtt)
        : startTc(options.up, options.down, options.rtt, options.packetLoss);
    }

    default:
      throw new Error('Platform ' + platform() + ' not supported');
  }
}
export async function stop(options = {}) {
  switch (platform()) {
    case 'darwin': {
      return options.localhost ? stopPfctlLocalhost() : stopPfctl();
    }

    case 'linux': {
      return options.localhost ? stopTcLocalhost() : stopTc();
    }

    default:
      throw new Error('Platform ' + platform() + ' not supported');
  }
}
