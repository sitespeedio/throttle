'use strict';
const execa = require('execa');

async function getDefaultInterface() {
  const result = await execa.shell(
    "sudo route | grep '^default' | grep -o '[^ ]*$'"
  );
  return result.stdout;
}

async function modProbe() {
  try {
    await execa('sudo', ['modprobe', 'ifb']);
  } catch (e) {
    // we are probably in a Docker env
    // let us hope that the host is Linux
    await execa('sudo', ['ip', 'link', 'add', 'ifb0', 'type', 'ifb']);
  }
}

async function setup(defaultInterface) {
  await execa('sudo', ['ip', 'link', 'set', 'dev', 'ifb0', 'up']);
  await execa('sudo', [
    'tc',
    'qdisc',
    'add',
    'dev',
    defaultInterface,
    'ingress'
  ]);
  await execa('sudo', [
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
  ]);
}

async function setLimits(up, down, halfWayRTT, iFace) {
  await execa('sudo', [
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
    `${halfWayRTT}ms`,
    'rate',
    `${down}kbit`
  ]);
  await execa('sudo', [
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
    `${halfWayRTT}ms`,
    'rate',
    `${up}kbit`
  ]);
}

module.exports = {
  async start(up, down, rtt) {
    const halfWayRTT = rtt / 2;

    try {
      await this.stop();
    } catch (e) {
      // ignore
    }

    const iFace = await getDefaultInterface();
    await modProbe();
    await setup(iFace);
    await setLimits(up, down, halfWayRTT, iFace);
  },
  async stop() {
    const iFace = await getDefaultInterface();

    try {
      try {
        await execa('sudo', ['tc', 'qdisc', 'del', 'dev', iFace, 'root']);
        await execa('sudo', ['tc', 'qdisc', 'del', 'dev', iFace, 'ingress']);
      } catch (e) {
        // make sure we try to remove the ingress
        execa('sudo', ['tc', 'qdisc', 'del', 'dev', iFace, 'ingress']);
      }
    } catch (e) {
      // ignore
    }

    await execa('sudo', ['tc', 'qdisc', 'del', 'dev', 'ifb0', 'root']);
  }
};
