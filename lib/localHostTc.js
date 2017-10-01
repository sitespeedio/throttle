'use strict';
const execa = require('execa');

module.exports = {
  start(delay) {
    const halfWayDelay = delay / 2;
    return execa('sudo', [
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
  stop() {
    return execa('sudo', ['tc', 'qdisc', 'del', 'dev', 'lo', 'root']);
  }
};
