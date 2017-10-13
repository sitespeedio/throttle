#!/usr/bin/env node

'use strict';

const minimist = require('minimist');
const throttler = require('../lib/');

const defaultUp = 330;
const defaultDown = 780;
const defaultRtt = 200;

const argv = minimist(process.argv.slice(2), {
  boolean: ['stop', 'localhost']
});

if (argv.help) {
  console.log('   Set the connectivity using the throttler (pfctl/tc)');
  console.log('   Usage: throttler [options]');
  console.log(
    '   If you run in Docker throtler will only work on a Linux host'
  );
  console.log('   In Docker make sure to run: sudo modprobe ifb numifbs=1');
  console.log('   And run your container with --cap-add=NET_ADMIN\n');
  console.log('   Options:');
  console.log('   --stop            Remove all settings');
  console.log('   --up              Upload in Kbit/s ');
  console.log('   --down            Download Kbit/s');
  console.log('   --rtt             RTT in ms');
} else {
  if (argv.stop) {
    const options = {
      localhost: argv.localhost
    };
    throttler
      .stop(options)
      .then(() => console.log('Stopped throttler'))
      .catch(() => console.log('No throttler to stop'));
  } else {
    const options = {
      up: argv.up || defaultUp,
      down: argv.down || defaultDown,
      rtt: argv.rtt || defaultRtt,
      localhost: argv.localhost
    };

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
