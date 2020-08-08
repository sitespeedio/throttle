'use strict';
const sudo = require('./sudo');
const shell = require('./shell');

module.exports = {
  async start(rtt) {
    const halfWayRTT = rtt / 2;

    await this.stop();

    await sudo('dnctl', '-q', 'flush');
    await sudo('dnctl', '-q', 'pipe', 'flush');

    await sudo(
      'dnctl',
      'pipe',
      1,
      'config',
      'delay',
      `${halfWayRTT}ms`,
      'noerror'
    );

    await shell(
      'echo "dummynet out from any to 127.0.0.1 pipe 1" | sudo pfctl -f -'
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
