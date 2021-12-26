import { promisify } from 'util';
import { execFile } from 'child_process';
const execFilePromisified = promisify(execFile);

export default function shell(command, options) {
  return execFilePromisified(command, options);
}
