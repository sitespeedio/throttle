import shell from './shell.js';
import sudo from './sudo.js';

async function getDefaultInterface() {
  const result = await shell(
    "sudo ip route | awk '/default/ {print $5; exit}' | tr -d '\n'",
    {
      shell: true
    }
  );

  if (result.stdout.length === 0 && result.stderr.length > 0) {
    throw new Error(
      'There was an error getting the default interface:\n\n' + result.stderr
    );
  }

  return result.stdout;
}

async function moduleProbe() {
  try {
    await sudo('modprobe', 'ifb');
  } catch {
    // we are probably in a Docker env
    // let us hope that the host is Linux
    try {
      await sudo('ip', 'link', 'add', 'ifb0', 'type', 'ifb');
    } catch {
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

async function setLimits(up, down, halfWayRTT, packetLoss, indexFace) {
  if (down) {
    const parameters = [
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
      parameters.push('loss', `${packetLoss}%`);
    }

    await sudo.apply(this, parameters);
  }
  if (up) {
    await sudo(
      'tc',
      'qdisc',
      'add',
      'dev',
      indexFace,
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
      indexFace,
      'root',
      'handle',
      '1:0',
      'netem',
      'delay',
      `${halfWayRTT}ms`
    );
  }
}

export async function start(up, down, rtt = 0, packetLoss = 0) {
  const halfWayRTT = rtt / 2;

  try {
    await stop();
  } catch {
    // ignore
  }

  const indexFace = await getDefaultInterface();
  await moduleProbe();
  await setup(indexFace);
  await setLimits(up, down, halfWayRTT, packetLoss, indexFace);
}
export async function stop() {
  const indexFace = await getDefaultInterface();

  try {
    try {
      await sudo('tc', 'qdisc', 'del', 'dev', indexFace, 'root');
      await sudo('tc', 'qdisc', 'del', 'dev', indexFace, 'ingress');
    } catch {
      // make sure we try to remove the ingress
      await sudo('tc', 'qdisc', 'del', 'dev', indexFace, 'ingress');
    }
  } catch {
    // ignore
  }

  try {
    await sudo('tc', 'qdisc', 'del', 'dev', 'ifb0', 'root');
  } catch {
    // do nada
  }
}
