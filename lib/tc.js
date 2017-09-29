'use strict';
const execa = require('execa');

function getDefaultInterface() {
  return execa
    .shell("sudo route | grep '^default' | grep -o '[^ ]*$'")
    .then(result => {
      return result.stdout;
    });
}

function modProbe() {
  return execa('sudo', ['modprobe', 'ifb']).catch(() => {
    // we are probably in a Docker env
    // let us hope that the host is Linux
    return execa('sudo', ['ip', 'link', 'add', 'ifb0', 'type', 'ifb']);
  });
}

function setup(defaultInterface) {
  return execa('sudo', ['ip', 'link', 'set', 'dev', 'ifb0', 'up'])
    .then(() =>
      execa('sudo', ['tc', 'qdisc', 'add', 'dev', defaultInterface, 'ingress'])
    )
    .then(() =>
      execa('sudo', [
        'tc',
        'filter',
        'add',
        'dev',
        defaultInterface,
        'parent',
        'ffff:',
        'protocol',
        'ip',
        'u32',
        'match',
        'u32',
        '0',
        '0',
        'flowid',
        '1:1',
        'action',
        'mirred',
        'egress',
        'redirect',
        'dev',
        'ifb0'
      ])
    );
}

function setLimits(up, down, halfWayRTT, iFace) {
  return execa('sudo', [
    'tc',
    'qdisc',
    'add',
    'dev',
    'ifb0',
    'root',
    'handle',
    '1:0',
    'netem',
    'delay',
    `${halfWayRTT}ms`
  ])
    .then(() =>
      execa('sudo', [
        'tc',
        'qdisc',
        'add',
        'dev',
        'ifb0',
        'parent',
        '1:1',
        'handle',
        '10:',
        'tbf',
        'rate',
        `${down}kbit`,
        'buffer',
        150000,
        'limit',
        150000
      ])
    )
    .then(() =>
      execa('sudo', [
        'tc',
        'qdisc',
        'add',
        'dev',
        iFace,
        'root',
        'handle',
        '1:0',
        'netem',
        'delay',
        `${halfWayRTT}ms`
      ])
    )
    .then(() =>
      execa('sudo', [
        'tc',
        'qdisc',
        'add',
        'dev',
        iFace,
        'parent',
        '1:1',
        'handle',
        '10:',
        'tbf',
        'rate',
        `${up}kbit`,
        'buffer',
        150000,
        'limit',
        150000
      ])
    );
}

module.exports = {
  start(up, down, rtt) {
    const halfWayRTT = rtt / 2;
    // Get the default network interface
    let iFace;
    return getDefaultInterface()
      .then(iFace2 => {
        iFace = iFace2;
      })
      .then(() => modProbe())
      .then(() => setup(iFace))
      .then(() => setLimits(up, down, halfWayRTT, iFace));
  },
  stop() {
    return getDefaultInterface()
      .then(iFace =>
        execa('sudo', ['tc', 'qdisc', 'del', 'dev', iFace, 'root']).then(() =>
          execa('sudo', ['tc', 'qdisc', 'del', 'dev', iFace, 'ingress'])
        )
      )
      .then(() => execa('sudo', ['tc', 'qdisc', 'del', 'dev', 'ifb0', 'root']));
  }
};
