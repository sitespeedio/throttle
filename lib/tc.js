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
  // since the default route may be gone while throttling is active
  const addrResult = await shell(
    "ip -o -4 addr show scope global | awk '{print $2; exit}'"
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

// Only used when setup() fails because another tool already holds the
// ingress qdisc slot. Explicit filter priorities make it possible to
// remove exactly these filters on stop without touching filters added
// by whoever owns the qdisc. High numbers run last, after auto-assigned
// priorities (49152 and down), so monitoring agents see the traffic
// before it is redirected to ifb0.
const FILTER_PREF_IP = '65000';
const FILTER_PREF_IPV6 = '65001';

async function getIngressSlotKind(defaultInterface) {
  const result = await shell(`sudo tc qdisc show dev ${defaultInterface}`);
  const match = result.stdout.match(/^qdisc (ingress|clsact) ffff:/m);
  return match ? match[1] : undefined;
}

async function setupOnBusyIngressSlot(defaultInterface, setupError) {
  // The ingress slot is exclusive per device and can already be held by
  // another tool: GitHub-hosted runners come with an eBPF monitoring
  // agent that attaches a clsact qdisc to the default interface, which
  // makes the plain qdisc add in setup() fail with "Exclusivity flag on,
  // cannot modify". Filters can attach to the existing hook instead, but
  // clsact only accepts them on its ffff:fff2 ingress class.
  const kind = await getIngressSlotKind(defaultInterface);
  if (kind !== 'ingress' && kind !== 'clsact') {
    throw setupError;
  }
  const parent = kind === 'clsact' ? 'ffff:fff2' : 'ffff:';

  for (const [protocol, pref] of [
    ['ip', FILTER_PREF_IP],
    ['ipv6', FILTER_PREF_IPV6]
  ]) {
    await sudo(
      'tc',
      'filter',
      'add',
      'dev',
      defaultInterface,
      'parent',
      parent,
      'protocol',
      protocol,
      'pref',
      pref,
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
}

async function removeBusyIngressSlotFilters(indexFace) {
  // Only relevant when setupOnBusyIngressSlot() attached the filters to a
  // qdisc that belongs to another tool: the qdisc deletes in stop() leave
  // that qdisc alone (they fail on kind mismatch), so remove exactly our
  // filters and nothing else.
  const kind = await getIngressSlotKind(indexFace);
  if (!kind) {
    return;
  }
  const parent = kind === 'clsact' ? 'ffff:fff2' : 'ffff:';
  for (const [protocol, pref] of [
    ['ip', FILTER_PREF_IP],
    ['ipv6', FILTER_PREF_IPV6]
  ]) {
    try {
      await sudo(
        'tc',
        'filter',
        'del',
        'dev',
        indexFace,
        'parent',
        parent,
        'protocol',
        protocol,
        'pref',
        pref
      );
    } catch {
      // ignore
    }
  }
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
  try {
    await setup(indexFace);
  } catch (error) {
    await setupOnBusyIngressSlot(indexFace, error);
  }
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
    await removeBusyIngressSlotFilters(indexFace);
  } catch {
    // ignore
  }

  try {
    await sudo('tc', 'qdisc', 'del', 'dev', 'ifb0', 'root');
  } catch {
    // do nada
  }
}
