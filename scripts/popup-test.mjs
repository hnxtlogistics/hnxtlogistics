import 'dotenv/config';
import { chromium } from 'playwright';
import { dismissCookies } from './helpers.mjs';
const B = process.env.BASE_URL || 'http://localhost:4000';
const fails = [];
const check = (l, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${l}`); if (!ok) fails.push(l); };

const browser = await chromium.launch();

// The popup waits the delay set in seed.js (10 seconds) after consent.
const DELAY = 10000;

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

  await dialog.waitFor({ state: 'visible', timeout: DELAY + 3000 });
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
  await page.waitForTimeout(DELAY + 1000);
  check('stays closed after dismissal', await page.locator('[role=dialog][aria-modal=true]').count() === 0);

  // Suppressed where it would be redundant.
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(`${B}/contact`, { waitUntil: 'networkidle' });
  await dismissCookies(p2);
  await p2.waitForTimeout(DELAY + 1000);
  check('suppressed on the contact page', await p2.locator('[role=dialog][aria-modal=true]').count() === 0);

  const ctx3 = await browser.newContext();
  const p3 = await ctx3.newPage();
  await p3.goto(`${B}/quote`, { waitUntil: 'networkidle' });
  await dismissCookies(p3);
  await p3.waitForTimeout(DELAY + 1000);
  check('suppressed on the quote page', await p3.locator('[role=dialog][aria-modal=true]').count() === 0);
} finally {
  await browser.close();
}
console.log(fails.length ? `\n${fails.length} FAILED` : '\nAll popup checks passed');
process.exit(fails.length ? 1 : 0);
