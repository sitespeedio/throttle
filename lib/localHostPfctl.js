import sudo from './sudo.js';
import shell from './shell.js';

export async function start(rtt, packetLoss=0) {
  const halfWayRTT = rtt / 2;

  await stop();

  await sudo('dnctl', '-q', 'flush');
  await sudo('dnctl', '-q', 'pipe', 'flush');

  const parameters = [
    'dnctl',
    'pipe',
    1,
    'config',
    'delay',
    `${halfWayRTT}ms`
  ];
  if (packetLoss > 0) {
    parameters.push('plr', packetLoss / 100, 'noerror');
  }
  await sudo.apply(this, parameters);

  await shell(
    'echo "dummynet out from any to 127.0.0.1 pipe 1" | sudo pfctl -f -'
  );

  await sudo('pfctl', '-E');
}
export async function stop() {
  await sudo('dnctl', '-q', 'flush');
  await sudo('dnctl', '-q', 'pipe', 'flush');
  await sudo('pfctl', '-f', '/etc/pf.conf');
  await sudo('pfctl', '-E');
  await sudo('pfctl', '-d');
}
