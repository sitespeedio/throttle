'use strict';
const sudo = require('./sudo');
const path = require('path');
const execa = require('execa');

module.exports = {
  async start(up, down, rtt = 0) {
    const halfWayRTT = rtt / 2;

    await this.stop();

    await sudo('dnctl', '-q', 'flush');
    await sudo('dnctl', '-q', 'pipe', 'flush');

    await sudo('dnctl', 'pipe', 1, 'config', 'delay', '0ms', 'noerror');
    await sudo('dnctl', 'pipe', 2, 'config', 'delay', '0ms', 'noerror');

    const a = await execa.command(
      'echo "dummynet in all pipe 1\ndummynet out all pipe 2" | sudo pfctl -f -',
      { shell: true }
    );

    if (down) {
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
    }

    if (up) {
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
    }

    if (!up && !down && rtt > 0) {
      await sudo('dnctl', 'pipe', 1, 'config', 'delay', `${halfWayRTT}ms`);
      await sudo('dnctl', 'pipe', 2, 'config', 'delay', `${halfWayRTT}ms`);
    }

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
