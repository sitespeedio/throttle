'use strict';
const sudo = require('./sudo');

module.exports = {
  async start(delay) {
    const halfWayDelay = delay / 2;

    try {
      await this.stop();
    } catch (e) {
      // ignore
    }

    await sudo(
      'tc',
      'qdisc',
      'add',
      'dev',
      'lo',
      'root',
      'handle',
      '1:0',
      'netem',
      'delay',
      `${halfWayDelay}ms`
    );
  },
  async stop() {
    await sudo('tc', 'qdisc', 'del', 'dev', 'lo', 'root');
  }
};
