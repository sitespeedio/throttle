'use strict';
const execa = require('execa');

module.exports = {
  start(delay) {
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
      `${delay}ms`
    ]);
  },
  stop() {
    return execa('sudo', ['tc', 'qdisc', 'del', 'dev', 'lo', 'root']);
  }
};
