'use strict';
const execa = require('execa');
const path = require('path');

const confPath = path.resolve(__dirname, '..', 'conf');
const pfctlConfPath = path.resolve(confPath, 'pfctl.rules');

module.exports = {
  async start(up, down, rtt) {
    const halfWayRTT = rtt / 2;

    await this.stop();

    await execa('sudo', ['dnctl', '-q', 'flush']);
    await execa('sudo', ['dnctl', '-q', 'pipe', 'flush']);

    await execa('sudo', [
      'dnctl',
      'pipe',
      1,
      'config',
      'delay',
      '0ms',
      'noerror'
    ]);

    await execa('sudo', [
      'dnctl',
      'pipe',
      2,
      'config',
      'delay',
      '0ms',
      'noerror'
    ]);
    // Needs the right path
    await execa('sudo', ['pfctl', '-f', pfctlConfPath]);

    await execa('sudo', [
      'dnctl',
      'pipe',
      1,
      'config',
      'bw',
      `${down}Kbit/s`,
      'delay',
      `${halfWayRTT}ms`
    ]);

    await execa('sudo', [
      'dnctl',
      'pipe',
      3,
      'config',
      'bw',
      `${up}Kbit/s`,
      'delay',
      `${halfWayRTT}ms`
    ]);
    await execa('sudo', ['pfctl', '-E']);
  },
  async stop() {
    await execa('sudo', ['dnctl', '-q', 'flush']);
    await execa('sudo', ['dnctl', '-q', 'pipe', 'flush']);
    await execa('sudo', ['pfctl', '-f', '/etc/pf.conf']);
    await execa('sudo', ['pfctl', '-E']);
    await execa('sudo', ['pfctl', '-d']);
  }
};
