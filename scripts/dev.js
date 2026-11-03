const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(npm, ['run', 'dev:server'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }),
  spawn(npm, ['run', 'dev:client'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }),
];

const stopChildren = () => {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
};

process.on('SIGINT', stopChildren);
process.on('SIGTERM', stopChildren);

for (const child of children) {
  child.on('error', (error) => {
    console.error(`Could not start development process: ${error.message}`);
    stopChildren();
    process.exitCode = 1;
  });
}
