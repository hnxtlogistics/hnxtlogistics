import 'dotenv/config';
import { chromium } from 'playwright';

const B = process.env.BASE_URL || 'http://localhost:4000';
const fails = [];
const check = (l, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${l}`); if (!ok) fails.push(l); };
const KEY = 'hnxt.cookieConsent';

const browser = await chromium.launch();

// Shown on a first visit
let ctx = await browser.newContext();
let page = await ctx.newPage();
await page.goto(`${B}/`, { waitUntil: 'networkidle' });
const bar = page.getByRole('dialog', { name: /Cookies on this site/i });
await bar.waitFor({ state: 'visible', timeout: 5000 });
check('banner appears on a first visit', await bar.isVisible());
check('offers a reject option', await page.getByRole('button', { name: 'Necessary only' }).count() === 1);
check('links to the privacy notice', await bar.getByRole('link', { name: /Privacy notice/i }).count() === 1);

// No tracking storage is written before a decision
const before = await page.evaluate((k) => window.localStorage.getItem(k), KEY);
check('nothing stored before a choice is made', before === null);

// Reject stores analytics: false
await page.getByRole('button', { name: 'Necessary only' }).click();
await page.waitForTimeout(400);
check('banner closes after choosing', await page.getByRole('dialog', { name: /Cookies on this site/i }).count() === 0);
const rejected = JSON.parse(await page.evaluate((k) => window.localStorage.getItem(k), KEY));
check('rejection is recorded', rejected.analytics === false && rejected.necessary === true);

// Choice survives a reload
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(700);
check('choice persists across reloads', await page.getByRole('dialog', { name: /Cookies on this site/i }).count() === 0);

// Once answered, it must stay gone — there is no footer control any more.
await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(400);
check('no cookie control in the footer', await page.getByRole('button', { name: 'Cookie settings' }).count() === 0);
check('banner stays closed', await page.getByRole('dialog', { name: /Cookies on this site/i }).count() === 0);
await ctx.close();

// Accept all stores analytics: true
ctx = await browser.newContext();
page = await ctx.newPage();
await page.goto(`${B}/`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Accept all' }).click();
await page.waitForTimeout(400);
const accepted = JSON.parse(await page.evaluate((k) => window.localStorage.getItem(k), KEY));
check('acceptance is recorded', accepted.analytics === true);

// Per-category choice
await ctx.close();
ctx = await browser.newContext();
page = await ctx.newPage();
await page.goto(`${B}/`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Choose' }).click();
await page.waitForTimeout(300);
check('necessary cannot be switched off', await page.locator('#consent-necessary').isDisabled());
await page.locator('#consent-analytics').check();
await page.getByRole('button', { name: 'Save choices' }).click();
await page.waitForTimeout(400);
const custom = JSON.parse(await page.evaluate((k) => window.localStorage.getItem(k), KEY));
check('per-category choice saved', custom.analytics === true);

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nAll cookie-consent checks passed');
process.exit(fails.length ? 1 : 0);
