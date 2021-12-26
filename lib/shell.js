import execFile from './execFile.js';

export default function shell(command) {
  if (process.env.LOG_THROTTLE) {
    console.log(command);
  }
  return execFile(command, { shell: true });
}
