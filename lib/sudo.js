import execFile from './execFile.js';

export default function sudo(command, ...args) {
  if (process.env.LOG_THROTTLE) {
    console.log('sudo', command, ...args);
  }
  return execFile('sudo', [command, ...args]);
}
