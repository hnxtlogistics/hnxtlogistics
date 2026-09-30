/**
 * Boots a throwaway server against a temporary database, runs every suite,
 * then tears it down.
 *
 * Tests used to run against whatever server happened to be up, which meant
 * they edited real content and tripped the production rate limits when run
 * back to back. This isolates them completely.
 */
import { spawn, spawnSync } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';
import { setTimeout as wait } from 'node:timers/promises';

const PORT = Number(process.env.TEST_PORT) || 4100;
const BASE_URL = `http://localhost:${PORT}`;
const DB = '/tmp/hnxt-test.db';
const ADMIN_EMAIL = 'test-admin@hnxtlogistics.test';
const ADMIN_PASSWORD = 'test-password-1234';

for (const suffix of ['', '-wal', '-shm']) {
  const path = DB + suffix;
  if (existsSync(path)) rmSync(path);
}

const env = {
  ...process.env,
  NODE_ENV: 'development',
  DATABASE_PATH: DB,
  PORT: String(PORT),
  JWT_SECRET: 'test-only-secret-not-used-in-production-abc123',
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ENQUIRY_RATE_MAX: '500',
  BASE_URL
};

console.log('Seeding a temporary database…');
spawnSync('node', ['server/seed.js'], { env, stdio: 'inherit' });

console.log(`Starting a test server on ${BASE_URL}…\n`);
const server = spawn('node', ['server/index.js'], { env, stdio: ['ignore', 'ignore', 'inherit'] });

let ready = false;
for (let attempt = 0; attempt < 40 && !ready; attempt++) {
  await wait(250);
  ready = await fetch(`${BASE_URL}/api/health`).then((r) => r.ok).catch(() => false);
}
if (!ready) {
  server.kill();
  console.error('Test server never became ready.');
  process.exit(1);
}

const SUITES = [
  ['End-to-end', 'scripts/e2e.mjs'],
  ['Admin portal', 'scripts/admin-test.mjs'],
  ['Authentication', 'scripts/auth-test.mjs'],
  ['Contact pop-up', 'scripts/popup-test.mjs'],
  ['Quote form', 'scripts/quote-test.mjs'],
  ['Cookie consent', 'scripts/cookie-test.mjs'],
  ['Accessibility (site)', 'scripts/a11y.mjs'],
  ['Accessibility (admin)', 'scripts/a11y-admin.mjs']
];

const failed = [];
for (const [name, script] of SUITES) {
  console.log(`\n${'═'.repeat(58)}\n  ${name}\n${'═'.repeat(58)}`);
  const result = spawnSync('node', [script], { env, stdio: 'inherit' });
  if (result.status !== 0) failed.push(name);
}

server.kill();
await wait(300);
for (const suffix of ['', '-wal', '-shm']) {
  const path = DB + suffix;
  if (existsSync(path)) rmSync(path);
}

console.log(`\n${'═'.repeat(58)}`);
console.log(failed.length ? `FAILED: ${failed.join(', ')}` : 'All suites passed.');
console.log('═'.repeat(58));
process.exit(failed.length ? 1 : 0);
