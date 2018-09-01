'use strict';
const sudo = require('./sudo');
const path = require('path');

const confPath = path.resolve(__dirname, '..', 'conf');
const pfctlConfPath = path.resolve(confPath, 'pfctl.rules');

module.exports = {
  async start(up, down, rtt) {
    const halfWayRTT = rtt / 2;

    await this.stop();

    await sudo('dnctl', '-q', 'flush');
    await sudo('dnctl', '-q', 'pipe', 'flush');

    await sudo('dnctl', 'pipe', 1, 'config', 'delay', '0ms', 'noerror');
    await sudo('dnctl', 'pipe', 2, 'config', 'delay', '0ms', 'noerror');
    // Needs the right path
    await sudo('pfctl', '-f', pfctlConfPath);

    await sudo(
      'dnctl',
      'pipe',
      1,
      'config',
      'bw',
      `${down}Kbit/s`,
      'delay',
      `${halfWayRTT}ms`
    );

    await sudo(
      'dnctl',
      'pipe',
      2,
      'config',
      'bw',
      `${up}Kbit/s`,
      'delay',
      `${halfWayRTT}ms`
    );
    await sudo('pfctl', '-E');
  },
  async stop() {
    await sudo('dnctl', '-q', 'flush');
    await sudo('dnctl', '-q', 'pipe', 'flush');
    await sudo('pfctl', '-f', '/etc/pf.conf');
    await sudo('pfctl', '-E');
    await sudo('pfctl', '-d');
  }
};
