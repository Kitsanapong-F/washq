const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('\x1b[1m\x1b[34m==================================================\x1b[0m');
console.log('\x1b[1m\x1b[34m🚀 Starting WashQ Full-Stack Services...\x1b[0m');
console.log('\x1b[1m\x1b[34m==================================================\x1b[0m\n');

const api = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, '../api'),
  shell: true,
  stdio: 'pipe',
  env: process.env
});

const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, '../frontend'),
  shell: true,
  stdio: 'pipe',
  env: process.env
});

function pipeOutput(child, name, color) {
  const prefix = `${color}[${name}]\x1b[0m `;
  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${prefix}${line}`);
      }
    }
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.error(`${prefix}${line}`);
      }
    }
  });

  child.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${prefix}Process exited with code ${code}`);
    }
  });
}

pipeOutput(api, 'API', '\x1b[36m'); // Cyan
pipeOutput(frontend, 'FRONTEND', '\x1b[32m'); // Green

function cleanExit() {
  console.log('\n\x1b[33m🛑 กำลังปิดการทำงานระบบ WashQ (API & Frontend)...\x1b[0m');
  try {
    if (isWindows) {
      if (api.pid) spawn('taskkill', ['/pid', api.pid, '/f', '/t']);
      if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid, '/f', '/t']);
    } else {
      if (api.pid) api.kill('SIGINT');
      if (frontend.pid) frontend.kill('SIGINT');
    }
  } catch (e) {
    // Ignore shutdown errors
  }
  process.exit();
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
