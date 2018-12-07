#!/usr/bin/env node

'use strict';

const minimist = require('minimist');
const throttler = require('../lib/');
const packageInfo = require('../package');
const defaultUp = 330;
const defaultDown = 780;
const defaultRtt = 200;

const profiles = {
  '3g': {
    down: 1600,
    up: 768,
    rtt: 150
  },
  '3gfast': {
    down: 1600,
    up: 768,
    rtt: 75
  },
  '3gslow': {
    down: 400,
    up: 400,
    rtt: 200
  },
  '2g': {
    down: 35,
    up: 32,
    rtt: 650
  },
  cable: {
    down: 5000,
    up: 1000,
    rtt: 14
  }
};

const argv = minimist(process.argv.slice(2), {
  boolean: ['stop', 'localhost']
});

if (argv.help || argv._[0] === 'help') {
  console.log('   Set the connectivity using the throttler (pfctl/tc)');
  console.log('   Usage: throttler [options]');
  console.log(
    '   If you run in Docker throttler will only work on a Linux host'
  );
  console.log('   In Docker make sure to run: sudo modprobe ifb numifbs=1');
  console.log('   And run your container with --cap-add=NET_ADMIN\n');
  console.log('   Options:');
  console.log('   --stop            Remove all settings');
  console.log('   --up              Upload in Kbit/s ');
  console.log('   --down            Download Kbit/s');
  console.log('   --rtt             RTT in ms');
  console.log(
    '   --profile         Premade profiles, set to one of the following'
  );
  Object.keys(profiles).forEach(function(profile) {
    console.log(
      '                     ' +
        profile +
        ': ' +
        'up:' +
        profiles[profile].up +
        ' down:' +
        profiles[profile].down +
        ' rtt:' +
        profiles[profile].rtt
    );
  });
} else if (argv.version) {
  console.log(`${packageInfo.version}`);
} else {
  if (argv.stop || argv._[0] === 'stop') {
    const options = {
      localhost: argv.localhost
    };
    throttler
      .stop(options)
      .then(() => console.log('Stopped throttler'))
      .catch(() => console.log('No throttler to stop'));
  } else {
    let options;
    if (argv.profile in profiles || argv._[0] in profiles) {
      options = profiles[argv.profile || argv._[0]];
      console.log('Using profile ' + (argv.profile ? argv.profile : argv._[0]));
    } else {
      console.log('Using default profile');
      options = {
        up: argv.up || defaultUp,
        down: argv.down || defaultDown,
        rtt: argv.rtt || defaultRtt,
        localhost: argv.localhost
      };
    }

    throttler.start(options).then(() => {
      if (options.localhost) {
        console.log(`Started throttler on localhost RTT:${options.rtt}ms `);
      } else {
        console.log(
          `Started throttler: Down:${options.down}kbit/s Up:${options.up}kbit/s RTT:${options.rtt}ms `
        );
      }
    });
  }
}
