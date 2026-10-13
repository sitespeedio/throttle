import sudo from './sudo.js';

// Real networks use 1500-byte packets. With the loopback default (65536),
// the receive window of the browser limits the transfer, and the number of
// round trips changes from run to run.
const NETWORK_MTU = '1500';
const LOOPBACK_DEFAULT_MTU = '65536';

export async function start(delay) {
  const halfWayDelay = delay / 2;

  try {
    await stop();
  } catch {
    // ignore
  }

  await sudo(
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
  );
  await sudo('ip', 'link', 'set', 'dev', 'lo', 'mtu', NETWORK_MTU);
}
export async function stop() {
  await sudo('ip', 'link', 'set', 'dev', 'lo', 'mtu', LOOPBACK_DEFAULT_MTU);
  await sudo('tc', 'qdisc', 'del', 'dev', 'lo', 'root');
}
