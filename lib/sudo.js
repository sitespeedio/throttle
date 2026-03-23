import execFile from './execFile.js';

export default function sudo(command, ...arguments_) {
  if (process.env.LOG_THROTTLE) {
    console.log('sudo', command, ...arguments_);
  }
  return execFile('sudo', [command, ...arguments_]);
}
