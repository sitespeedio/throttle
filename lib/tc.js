'use strict';
const shell = require('./shell');
const sudo = require('./sudo');

async function getDefaultInterface() {
  const result = await shell(
    "sudo route | grep -m 1 '^default' | grep -o '[^ ]*$' | tr -d '\n'",
    { shell: true }
  );

  if (result.stdout.length === 0 && result.stderr.length > 0) {
    throw new Error(
      'There was an error getting the default interface:\n\n' + result.stderr
    );
  }

  return result.stdout;
}

async function modProbe() {
  try {
    await sudo('modprobe', 'ifb');
  } catch (e) {
    // we are probably in a Docker env
    // let us hope that the host is Linux
    try {
      await sudo('ip', 'link', 'add', 'ifb0', 'type', 'ifb');
    } catch (e) {
      // If we already setup ifb in a previous run, this will fail
    }
  }
}

async function setup(defaultInterface) {
  await sudo('ip', 'link', 'set', 'dev', 'ifb0', 'up');
  await sudo('tc', 'qdisc', 'add', 'dev', defaultInterface, 'ingress');
  await sudo(
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
  );
}

async function setLimits(up, down, halfWayRTT, packetLoss, iFace) {
  if (down) {
    const params = [
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
    ];

    if (packetLoss) {
      params.push('loss', `${packetLoss}%`);
    }

    await sudo.apply(this, params);
  }
  if (up) {
    await sudo(
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
    );
  }

  if (!up && !down && halfWayRTT > 0) {
    await sudo(
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
    );

    await sudo(
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
    );
  }
}

module.exports = {
  async start(up, down, rtt = 0, packetLoss = 0) {
    const halfWayRTT = rtt / 2;

    try {
      await this.stop();
    } catch (e) {
      // ignore
    }

    const iFace = await getDefaultInterface();
    await modProbe();
    await setup(iFace);
    await setLimits(up, down, halfWayRTT, packetLoss, iFace);
  },
  async stop() {
    const iFace = await getDefaultInterface();

    try {
      try {
        await sudo('tc', 'qdisc', 'del', 'dev', iFace, 'root');
        await sudo('tc', 'qdisc', 'del', 'dev', iFace, 'ingress');
      } catch (e) {
        // make sure we try to remove the ingress
        await sudo('tc', 'qdisc', 'del', 'dev', iFace, 'ingress');
      }
    } catch (e) {
      // ignore
    }

    try {
      await sudo('tc', 'qdisc', 'del', 'dev', 'ifb0', 'root');
    } catch (e) {
      // do nada
    }
  }
};
