#!/usr/bin/env node

/**
 * Explicit Prisma migration repair helper.
 *
 * This replaces the old "skip all pending migrations" behavior. Pending
 * migrations are not failures and must never be silently marked as applied.
 * Repairs now require an exact migration name, an explicit state, and a
 * confirmation flag. Without --confirm this command is a dry run.
 *
 * Examples:
 *   node scripts/skip-failed-migrations.js --migration=20260815090000_example --state=rolled-back
 *   node scripts/skip-failed-migrations.js --migration=20260815090000_example --state=rolled-back --confirm
 *   node scripts/skip-failed-migrations.js --migration=00000000000000_baseline --state=applied --confirm
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SCHEMA_PATH = 'prisma/schema.prisma';
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'prisma', 'migrations');
const VALID_STATES = new Set(['applied', 'rolled-back']);

function readOption(args, name) {
  const prefix = `--${name}=`;
  return args.find(argument => argument.startsWith(prefix))?.slice(prefix.length) || null;
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2);
  const migration = readOption(args, 'migration');
  const state = readOption(args, 'state');
  const confirmed = args.includes('--confirm');

  if (!migration) {
    fail('Provide exactly one migration with --migration=<name>. Bulk migration skipping is disabled.');
  }
  if (!/^[A-Za-z0-9_-]+$/.test(migration)) {
    fail('Migration names may contain only letters, numbers, underscores, and hyphens.');
  }
  if (!state || !VALID_STATES.has(state)) {
    fail('Provide --state=applied or --state=rolled-back.');
  }

  const migrationDir = path.join(MIGRATIONS_DIR, migration);
  if (state === 'applied' && !fs.existsSync(migrationDir)) {
    fail(`Cannot mark unknown local migration "${migration}" as applied.`);
  }

  const resolveFlag = state === 'applied' ? '--applied' : '--rolled-back';
  const command = ['prisma', 'migrate', 'resolve', resolveFlag, migration, `--schema=${SCHEMA_PATH}`];

  console.log(`Migration: ${migration}`);
  console.log(`Requested repair state: ${state}`);
  console.log(`Command: npx ${command.join(' ')}`);

  if (!confirmed) {
    console.log('Dry run only. Re-run with --confirm after verifying the database and migration SQL.');
    return;
  }

  console.warn('Applying explicit migration-history repair. This does not execute migration SQL.');
  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(executable, command, {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    fail(result.error.message);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  console.log('Migration history repaired successfully. Run `npx prisma migrate status` before deploying.');
}

if (require.main === module) {
  main();
}

module.exports = { main };
