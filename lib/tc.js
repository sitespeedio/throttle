import shell from './shell.js';
import sudo from './sudo.js';

async function getDefaultInterface() {
  // Try the default route first
  const routeResult = await shell(
    "sudo ip route | awk '/default/ {print $5; exit}' | tr -d '\n'"
  );
  if (routeResult.stdout.length > 0) {
    return routeResult.stdout;
  }

  // Fall back to finding the interface with a global IP address,
  // since the default route may be gone while throttling is active.
  // Exclude virtual interfaces (docker, bridge, veth) that may have
  // exclusive qdiscs.
  const addrResult = await shell(
    "ip -o -4 addr show scope global | grep -v -E 'docker|br-|veth' | awk '{print $2; exit}'"
  );
  if (addrResult.stdout.trim().length > 0) {
    return addrResult.stdout.trim();
  }

  throw new Error('Could not find the default network interface');
}

async function moduleProbe() {
  try {
    await sudo('modprobe', 'ifb');
    // eslint-disable-next-line no-empty
  } catch {}
}
async function setupifb0() {
  try {
    // Check if ifb0 exist
    await sudo('ip', 'link', 'show', 'ifb0');
  } catch {
    // Add the interface
    await sudo('ip', 'link', 'add', 'ifb0', 'type', 'ifb');
  }

  // Bring the interface up
  await sudo('ip', 'link', 'set', 'ifb0', 'up');
}

async function setup(defaultInterface) {
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
  await sudo(
    'tc',
    'filter',
    'add',
    'dev',
    defaultInterface,
    'parent',
    'ffff:',
    'protocol',
    'ipv6',
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
    const parameters = [
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
    ];

    if (packetLoss) {
      parameters.push('loss', `${packetLoss}%`);
    }

    await sudo.apply(this, parameters);
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
  await setupifb0();
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
