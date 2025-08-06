import sudo from './sudo.js';

export async function start(delay, packetLoss=0) {
  const halfWayDelay = delay / 2;

  try {
    await stop();
  } catch {
    // ignore
  }

  const parameters = [
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
  ];

  if (packetLoss) {
    parameters.push('loss', `${packetLoss}%`);
  }

  await sudo.apply(this, parameters);
}
export async function stop() {
  await sudo('tc', 'qdisc', 'del', 'dev', 'lo', 'root');
}
