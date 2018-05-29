'use strict';
const execa = require('execa');

module.exports = {
  async start(delay) {
    const halfWayDelay = delay / 2;

    try {
      await this.stop();
    } catch (e) {
      // ignore
    }

    await execa('sudo', [
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
    ]);
  },
  async stop() {
    await execa('sudo', ['tc', 'qdisc', 'del', 'dev', 'lo', 'root']);
  }
};
