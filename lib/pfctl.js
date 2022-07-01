import sudo from './sudo.js';
import shell from './shell.js';

export async function start(up, down, rtt = 0, packetLoss = 0) {
  const halfWayRTT = rtt / 2;

  await stop();

  await sudo('dnctl', '-q', 'flush');
  await sudo('dnctl', '-q', 'pipe', 'flush');

  await sudo('dnctl', 'pipe', 1, 'config', 'delay', '0ms', 'noerror');
  await sudo('dnctl', 'pipe', 2, 'config', 'delay', '0ms', 'noerror');

  await shell(
    'echo "dummynet in from any to ! 127.0.0.1 pipe 1\ndummynet out from ! 127.0.0.1 to any pipe 2" | sudo pfctl -f -'
  );

  if (down) {
    const parameters = [
      'dnctl',
      'pipe',
      1,
      'config',
      'bw',
      `${down}Kbit/s`,
      'delay',
      `${halfWayRTT}ms`
    ];
    if (packetLoss > 0) {
      parameters.push('plr', packetLoss / 100, 'noerror');
    }
    await sudo.apply(this, parameters);
  }

  if (up) {
    await sudo(
      'dnctl',
      'pipe',
      2,
      'config',
      'bw',
      `${up}Kbit/s`,
      'delay',
      `${halfWayRTT}ms`
    );
  }

  if (!up && !down && rtt > 0) {
    await sudo('dnctl', 'pipe', 1, 'config', 'delay', `${halfWayRTT}ms`);
    await sudo('dnctl', 'pipe', 2, 'config', 'delay', `${halfWayRTT}ms`);
  }

  await sudo('pfctl', '-E');
}
export async function stop() {
  await sudo('dnctl', '-q', 'flush');
  await sudo('dnctl', '-q', 'pipe', 'flush');
  await sudo('pfctl', '-f', '/etc/pf.conf');
  await sudo('pfctl', '-E');
  await sudo('pfctl', '-d');
}
