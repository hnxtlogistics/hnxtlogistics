import 'dotenv/config';
import { chromium } from 'playwright';
import { dismissCookies } from './helpers.mjs';
const B = process.env.BASE_URL || 'http://localhost:4000';
const fails = [];
const check = (l, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${l}`); if (!ok) fails.push(l); };

const browser = await chromium.launch();

// Speed the wait up rather than sitting for 10s: set the delay to its minimum.
const admin = await browser.newPage();
await admin.goto(`${B}/admin/popup`, { waitUntil: 'networkidle' });
await admin.fill('#field-email', process.env.ADMIN_EMAIL);
await admin.fill('#field-password', process.env.ADMIN_PASSWORD);
await admin.click('button[type=submit]');
await admin.waitForSelector('#field-delaySeconds');
const originalDelay = await admin.inputValue('#field-delaySeconds');
check('default delay is 10 seconds', originalDelay === '10');

// Under the floor must be rejected by the server, not silently accepted.
await admin.fill('#field-delaySeconds', '1');
await admin.click('button[type=submit]');
await admin.waitForTimeout(900);
check('delay below 3s is rejected', (await admin.textContent('body')).includes('highlighted fields'));

await admin.fill('#field-delaySeconds', '3');
await admin.click('button[type=submit]');
await admin.waitForTimeout(900);

try {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${B}/`, { waitUntil: 'networkidle' });

  // The popup deliberately waits until the cookie banner is answered.
  const beforeConsent = page.locator('[role=dialog][aria-modal=true]');
  await page.waitForTimeout(4500);
  check('waits for the cookie decision', await beforeConsent.count() === 0);
  await dismissCookies(page);

  const dialog = page.locator('[role=dialog][aria-modal=true]');
  await page.waitForTimeout(1200);
  check('hidden before the delay elapses', await dialog.count() === 0);

  await dialog.waitFor({ state: 'visible', timeout: 6000 });
  check('appears after the delay', await dialog.isVisible());
  check('is a labelled modal dialog', await dialog.getAttribute('aria-modal') === 'true'
        && Boolean(await dialog.getAttribute('aria-labelledby')));
  check('close button holds focus', await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label') === 'Close'));
  check('shows the contact email', (await dialog.textContent()).includes('hnxtlogistics@gmail.com'));

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  check('Escape closes it', await dialog.count() === 0);

  // Dismissal must survive a reload.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  check('stays closed after dismissal', await page.locator('[role=dialog][aria-modal=true]').count() === 0);

  // Suppressed where it would be redundant.
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(`${B}/contact`, { waitUntil: 'networkidle' });
  await dismissCookies(p2);
  await p2.waitForTimeout(5000);
  check('suppressed on the contact page', await p2.locator('[role=dialog][aria-modal=true]').count() === 0);

  const ctx3 = await browser.newContext();
  const p3 = await ctx3.newPage();
  await p3.goto(`${B}/quote`, { waitUntil: 'networkidle' });
  await dismissCookies(p3);
  await p3.waitForTimeout(5000);
  check('suppressed on the quote page', await p3.locator('[role=dialog][aria-modal=true]').count() === 0);
} finally {
  await admin.goto(`${B}/admin/popup`, { waitUntil: 'networkidle' });
  await admin.waitForSelector('#field-delaySeconds');
  await admin.fill('#field-delaySeconds', originalDelay);
  const save = admin.locator('button[type=submit]');
  if (await save.isEnabled()) { await save.click(); await admin.waitForTimeout(800); }
  check('delay restored to its original value', (await admin.inputValue('#field-delaySeconds')) === originalDelay);
  await browser.close();
}
console.log(fails.length ? `\n${fails.length} FAILED` : '\nAll popup checks passed');
process.exit(fails.length ? 1 : 0);
