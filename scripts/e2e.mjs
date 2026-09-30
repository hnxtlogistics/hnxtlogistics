/**
 * Browser smoke test of the whole loop: an admin edits content, a visitor
 * sees the change, submits an enquiry, and it lands back in the inbox.
 *
 * Run against a server started with `npm start`. The test restores every
 * value it touches in a finally block, so a mid-run failure cannot leave
 * residue that breaks the next run.
 */
import 'dotenv/config';
import { chromium } from 'playwright';
import { dismissCookies } from './helpers.mjs';

const B = process.env.BASE_URL || 'http://localhost:4000';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

const PHONE = '+91 98860 77321';
const DIGITS = PHONE.replace(/\D/g, '');

const fails = [];
const check = (label, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) fails.push(label);
};

const browser = await chromium.launch();
const admin = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

async function signIn(page) {
  await page.goto(`${B}/admin/company`, { waitUntil: 'networkidle' });
  if (await page.locator('#field-password').count()) {
    await page.fill('#field-email', EMAIL);
    await page.fill('#field-password', PASSWORD);
    await page.click('button[type=submit]');
  }
  await page.waitForSelector('#field-phone', { timeout: 10000 });
}

async function setContactNumbers(page, phone, whatsapp) {
  await page.goto(`${B}/admin/company`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#field-phone');
  await page.fill('#field-phone', phone);
  await page.fill('#field-whatsapp', whatsapp);
  const save = page.locator('button[type=submit]');
  if (await save.isEnabled()) {
    await save.click();
    await page.waitForTimeout(900);
  }
  return page.inputValue('#field-phone');
}

try {
  await signIn(admin);

  // Establish the precondition rather than assuming it.
  await setContactNumbers(admin, '', '');

  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(`${B}/`, { waitUntil: 'networkidle' });
  await dismissCookies(visitor);
  check('home renders the headline', (await visitor.textContent('h1')).includes('Cargo moves'));
  check('phone hidden while unset', !(await visitor.content()).includes(PHONE));

  // 1. Admin publishes a phone number through the UI.
  const saved = await setContactNumbers(admin, PHONE, PHONE);
  check('admin save persists the phone', saved === PHONE);
  check('admin confirms the site updated', (await admin.textContent('body')).includes('live site is updated'));

  // 2. A fresh anonymous visitor sees it everywhere it belongs.
  const fresh = await (await browser.newContext()).newPage();
  await fresh.goto(`${B}/contact`, { waitUntil: 'networkidle' });
  await dismissCookies(fresh);
  const contactHtml = await fresh.content();
  check('visitor sees the phone on contact', contactHtml.includes(PHONE));
  check('visitor sees a WhatsApp link', contactHtml.includes(`wa.me/${DIGITS}`));
  await fresh.goto(`${B}/`, { waitUntil: 'networkidle' });
  check('phone appears in the header', (await fresh.content()).includes(PHONE));

  // 3. Crawlers get the live details server-side, not a build-time snapshot.
  const shell = await fetch(`${B}/`).then((r) => r.text());
  check('structured data carries the phone', shell.includes(`"telephone":"${PHONE}"`));

  // 4. Quote form rejects bad input before accepting a good submission.
  await fresh.goto(`${B}/quote`, { waitUntil: 'networkidle' });
  await fresh.fill('#field-name', 'A');
  await fresh.fill('#field-email', 'not-an-email');
  await fresh.click('button[type=submit]');
  await fresh.waitForTimeout(800);
  check('invalid quote shows field errors', (await fresh.content()).includes('valid email address'));

  await fresh.fill('#field-name', 'Meridian Exports');
  await fresh.fill('#field-email', 'ops@meridian-exports.test');
  await fresh.fill('#field-phone', '+91 98450 10101');
  await fresh.fill('#field-origin', 'Bengaluru');
  await fresh.keyboard.press('Escape');
  await fresh.fill('#field-destination', 'Nhava Sheva');
  await fresh.keyboard.press('Escape');
  await fresh.fill('#field-weight', '2400 kg');
  await fresh.click('button[type=submit]');
  await fresh.waitForTimeout(1200);
  const receipt = await fresh.textContent('body');
  check('quote submits and returns a reference', receipt.includes('Enquiry received') && /HNXT-\d{5}/.test(receipt));

  // 5. It reaches the inbox.
  await admin.goto(`${B}/admin`, { waitUntil: 'networkidle' });
  await admin.waitForTimeout(900);
  const inbox = await admin.textContent('body');
  check('enquiry reaches the admin inbox', inbox.includes('Meridian Exports'));
  check('inbox shows the lane', inbox.includes('Bengaluru → Nhava Sheva'));

  // 6. The admin API is closed to anonymous callers.
  const anon = await (await browser.newContext()).newPage();
  await anon.goto(`${B}/`, { waitUntil: 'domcontentloaded' });
  const status = await anon.evaluate(async () => (await fetch('/api/admin/enquiries')).status);
  check('admin API rejects anonymous access', status === 401);
} finally {
  // Always restore, even if an assertion above threw.
  try {
    await signIn(admin);
    const restored = await setContactNumbers(admin, '', '');
    check('contact details restored', restored === '');
  } catch (err) {
    console.log(`FAIL  contact details restored (${err.message})`);
    fails.push('cleanup');
  }
  await browser.close();
}

console.log(fails.length ? `\n${fails.length} FAILED` : '\nAll checks passed');
process.exit(fails.length ? 1 : 0);
