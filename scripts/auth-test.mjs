/** Password reveal, forgot-password and reset-link handling. */
import 'dotenv/config';
import { chromium } from 'playwright';
import db from '../server/db.js';
import { createResetToken } from '../server/password-reset.js';

const B = process.env.BASE_URL || 'http://localhost:4000';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

const fails = [];
const check = (l, ok, note = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${l}${note ? `  — ${note}` : ''}`);
  if (!ok) fails.push(l);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });

try {
  // ── Password reveal ───────────────────────────────────────────────
  await page.goto(`${B}/admin`, { waitUntil: 'networkidle' });
  const field = page.locator('#field-password');
  await field.fill('VisibleSecret1');
  check('password starts masked', await field.getAttribute('type') === 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  check('eye reveals the password', await field.getAttribute('type') === 'text');
  check('control reports its state', await page.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed') === 'true');
  await page.getByRole('button', { name: 'Hide password' }).click();
  check('eye hides it again', await field.getAttribute('type') === 'password');

  // ── Forgot password: no account enumeration ───────────────────────
  await page.getByRole('button', { name: 'Forgot your password?' }).click();
  await page.waitForTimeout(400);
  await page.fill('#field-resetEmail', 'definitely-not-a-user@example.com');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await page.waitForTimeout(900);
  const unknownScreen = await page.textContent('body');
  check('unknown address gets the same screen', unknownScreen.includes('Check your email'));

  await page.getByRole('button', { name: 'Back to sign-in' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Forgot your password?' }).click();
  await page.waitForTimeout(300);
  await page.fill('#field-resetEmail', EMAIL);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await page.waitForTimeout(900);
  check('real address gets the same screen', (await page.textContent('body')).includes('Check your email'));

  // ── Token handling ────────────────────────────────────────────────
  await page.goto(`${B}/admin/reset?token=clearly-not-a-real-token`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  check('bogus token refused', (await page.textContent('body')).includes('cannot be used'));

  const issued = createResetToken(EMAIL);
  check('token issued for a real account', Boolean(issued));
  check('token stored hashed, not plain', (() => {
    const row = db.prepare('SELECT token_hash FROM password_resets ORDER BY id DESC LIMIT 1').get();
    return row && row.token_hash.length === 64 && !row.token_hash.includes(issued.token);
  })());

  const NEW_PASSWORD = 'reset-flow-password-9876';
  await page.goto(`${B}/admin/reset?token=${encodeURIComponent(issued.token)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  check('valid token opens the form', await page.locator('#field-newPassword').count() === 1);

  await page.fill('#field-newPassword', NEW_PASSWORD);
  await page.fill('#field-confirmPassword', 'something-else-entirely');
  await page.getByRole('button', { name: 'Save new password' }).click();
  await page.waitForTimeout(600);
  check('mismatched passwords refused', (await page.textContent('body')).includes('do not match'));

  await page.fill('#field-confirmPassword', NEW_PASSWORD);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await page.waitForTimeout(1000);
  check('password reset succeeds', (await page.textContent('body')).includes('Password changed'));

  // The new password must work, the old must not.
  const tryLogin = (pw) =>
    fetch(`${B}/api/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: pw })
    }).then((r) => r.status);
  check('new password signs in', await tryLogin(NEW_PASSWORD) === 200);
  check('old password rejected', await tryLogin(PASSWORD) === 401);

  // Single use.
  await page.goto(`${B}/admin/reset?token=${encodeURIComponent(issued.token)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  check('token cannot be reused', (await page.textContent('body')).includes('cannot be used'));

  // Put the original password back.
  const restore = createResetToken(EMAIL);
  await page.goto(`${B}/admin/reset?token=${encodeURIComponent(restore.token)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.fill('#field-newPassword', PASSWORD);
  await page.fill('#field-confirmPassword', PASSWORD);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await page.waitForTimeout(900);
  check('original password restored', await tryLogin(PASSWORD) === 200);
} finally {
  await browser.close();
}

console.log(fails.length ? `\n${fails.length} FAILED` : '\nAll authentication checks passed');
process.exit(fails.length ? 1 : 0);
