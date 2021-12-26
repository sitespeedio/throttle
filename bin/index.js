#!/usr/bin/env node

'use strict';
const fs = require('fs');
const minimist = require('minimist');
const throttler = require('../lib/');
const packageInfo = require('../package');

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
    down: 280,
    up: 256,
    rtt: 400
  },
  cable: {
    down: 5000,
    up: 1000,
    rtt: 14
  },
  dsl: {
    down: 1500,
    up: 384,
    rtt: 25
  },
  '3gem': {
    down: 400,
    up: 400,
    rtt: 200
  },
  '4g': {
    down: 9000,
    up: 9000,
    rtt: 85
  },
  lte: {
    down: 12000,
    up: 12000,
    rtt: 35
  },
  edge: {
    down: 240,
    up: 200,
    rtt: 420
  },
  dial: {
    down: 49,
    up: 30,
    rtt: 60
  },
  fois: {
    down: 20000,
    up: 5000,
    rtt: 2
  }
};

const argv = minimist(process.argv.slice(2), {
  boolean: ['stop', 'localhost']
});

async function run(argv) {
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
    console.log('   --packetLoss      Packet loss in %. Default is 0');
    console.log(
      '   --profile         Premade profiles, set to one of the following'
    );
    console.log('   --config          Path to config file');
    Object.keys(profiles).forEach(function (profile) {
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
    console.log('   --log             Log all network commands to the console');
  } else if (argv.version) {
    console.log(`${packageInfo.version}`);
  } else {
    if (argv.stop || argv._[0] === 'stop') {
      const options = {
        localhost: argv.localhost
      };
      await throttler.stop(options);
      console.log('Stopped throttler');
    } else {
      let options;
      if (argv.log) {
        process.env.LOG_THROTTLE = true;
      }
      if (argv.profile in profiles || argv._[0] in profiles) {
        options = profiles[argv.profile || argv._[0]];

        if (argv.packetLoss) {
          options.packetLoss = argv.packetLoss;
        }

        console.log(
          'Using profile ' + (argv.profile ? argv.profile : argv._[0])
        );
      } else if (argv.config) {
        try {
          const data = fs.readFileSync(argv.config, 'utf8');
          options = JSON.parse(data);
        } catch (e) {
          console.error(e);
          process.exitCode = 1;
        }
      } else {
        options = {
          up: argv.up,
          down: argv.down,
          rtt: argv.rtt,
          localhost: argv.localhost,
          packetLoss: argv.packetLoss || 0
        };
      }

      try {
        await throttler.start(options);
        if (options.localhost) {
          console.log(`Started throttler on localhost RTT:${options.rtt}ms `);
        } else {
          let msg = 'Started throttler:';
          if (typeof options.down !== 'undefined') {
            msg += ` Down:${options.down}kbit/s`;
          }
          if (typeof options.up !== 'undefined') {
            msg += ` Up:${options.up}kbit/s`;
          }
          if (typeof options.rtt !== 'undefined') {
            msg += ` RTT:${options.rtt}ms`;
          }
          if (typeof options.packetLoss !== 'undefined') {
            msg += ` PacketLoss:${options.packetLoss}%`;
          }
          console.log(msg);
        }
      } catch (e) {
        console.error(e);
        process.exitCode = 1;
      }
    }
  }
}

run(argv);
