'use strict';
const execa = require('execa');
const path = require('path');

const confPath = path.resolve(__dirname, '..', 'conf');
const pfctlConfPath = path.resolve(confPath, 'pfctl.rules');

module.exports = {
  start(up, down, rtt) {
    const halfWayRTT = rtt / 2;
    return (
      execa('sudo', ['dnctl', '-q', 'flush'])
        .then(() => execa('sudo', ['dnctl', '-q', 'pipe', 'flush']))
        .then(() =>
          execa('sudo', [
            'dnctl',
            'pipe',
            1,
            'config',
            'delay',
            '0ms',
            'noerror'
          ])
        )
        .then(() =>
          execa('sudo', [
            'dnctl',
            'pipe',
            2,
            'config',
            'delay',
            '0ms',
            'noerror'
          ])
        )
        // Needs the right path
        .then(() => execa('sudo', ['pfctl', '-f', pfctlConfPath]))
        .then(() =>
          execa('sudo', [
            'dnctl',
            'pipe',
            1,
            'config',
            'bw',
            `${down}Kbit/s`,
            'delay',
            `${halfWayRTT}ms`
          ])
        )
        .then(() =>
          execa('sudo', [
            'dnctl',
            'pipe',
            3,
            'config',
            'bw',
            `${up}Kbit/s`,
            'delay',
            `${halfWayRTT}ms`
          ])
        )
        .then(() => execa('sudo', ['pfctl', '-E']))
        .catch(error => {
          throw error;
        })
    );
  },
  stop() {
    return execa('sudo', ['dnctl', '-q', 'flush'])
      .then(() => execa('sudo', ['dnctl', '-q', 'pipe', 'flush']))
      .then(() => execa('sudo', ['pfctl', '-f', '/etc/pf.conf']))
      .then(() => execa('sudo', ['pfctl', '-E']))
      .then(() => execa('sudo', ['pfctl', '-d']))
      .catch(error => {
        throw error;
      });
  }
};
