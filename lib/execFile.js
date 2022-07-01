import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
const execFilePromisified = promisify(execFile);

export default function shell(command, options) {
  return execFilePromisified(command, options);
}
