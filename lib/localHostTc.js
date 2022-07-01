import sudo from './sudo.js';

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
}
export async function stop() {
  await sudo('tc', 'qdisc', 'del', 'dev', 'lo', 'root');
}
