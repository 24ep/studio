#!/usr/bin/env node

const { spawn } = require('node:child_process');

const args = process.argv.slice(2);
const turbo = args.includes('--turbo');
const fast = args.includes('--fast');
const portArg = args.find(arg => arg.startsWith('--port='));
const port = portArg?.slice('--port='.length) || process.env.PORT || '8021';

const nextBin = require.resolve('next/dist/bin/next');
const nextArgs = [nextBin, 'dev', '-p', String(port)];
if (turbo) nextArgs.push('--turbo');

const child = spawn(process.execPath, nextArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
    ...(fast ? { NEXT_PUBLIC_FAST_DEV: 'true' } : {}),
  },
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('error', error => {
  console.error(`Unable to start Next.js dev server: ${error.message}`);
  process.exit(1);
});

child.on('exit', code => process.exit(code ?? 1));
