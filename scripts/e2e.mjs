/**
 * Browser smoke test of the visitor loop: the site renders its seeded
 * content, a visitor submits an enquiry, and it is stored with a reference.
 *
 * Run against a server started with `npm start`, or through `npm test`.
 */
import 'dotenv/config';
import { chromium } from 'playwright';
import { dismissCookies, readEnquiries } from './helpers.mjs';

const B = process.env.BASE_URL || 'http://localhost:4000';

const fails = [];
const check = (label, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) fails.push(label);
};

const browser = await chromium.launch();

try {
  // 1. Seeded content renders.
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(`${B}/`, { waitUntil: 'networkidle' });
  await dismissCookies(visitor);
  check('home renders the headline', (await visitor.textContent('h1')).includes('Cargo moves'));

  await visitor.goto(`${B}/services`, { waitUntil: 'networkidle' });
  check('services page lists seeded services', (await visitor.textContent('body')).includes('Sea Freight'));

  // 2. Crawlers get the content server-side, not a build-time snapshot.
  const shell = await fetch(`${B}/`).then((r) => r.text());
  check('structured data carries the company', shell.includes('"name":"HNXT Logistics"'));

  // 3. Quote form rejects bad input before accepting a good submission.
  await visitor.goto(`${B}/quote`, { waitUntil: 'networkidle' });
  await visitor.fill('#field-name', 'A');
  await visitor.fill('#field-email', 'not-an-email');
  await visitor.click('button[type=submit]');
  await visitor.waitForTimeout(800);
  check('invalid quote shows field errors', (await visitor.content()).includes('Please enter a valid email ID.'));

  // Leaving the email field with a bad address warns before any submit.
  await visitor.fill('#field-email', 'name@gmail');
  await visitor.locator('#field-email').blur();
  check('bad email is flagged on leaving the field',
    (await visitor.textContent('#field-email-error'))?.trim() === 'Please enter a valid email ID.');
  await visitor.fill('#field-email', 'name@gmail.com');
  await visitor.locator('#field-email').blur();
  check('warning clears once the email is fixed', (await visitor.locator('#field-email-error').count()) === 0);

  await visitor.fill('#field-name', 'Meridian Exports');
  await visitor.fill('#field-email', 'ops@meridian-exports.test');
  await visitor.fill('#field-phone', '+91 98450 10101');
  await visitor.fill('#field-origin', 'Bengaluru');
  await visitor.keyboard.press('Escape');
  await visitor.fill('#field-destination', 'Nhava Sheva');
  await visitor.keyboard.press('Escape');
  await visitor.fill('#field-weight', '2400 kg');
  await visitor.click('button[type=submit]');
  await visitor.waitForTimeout(1200);
  const receipt = await visitor.textContent('body');
  const ref = receipt.match(/HNXT-\d{6}-[A-Z0-9]{4}/)?.[0];
  check('quote submits and returns a reference', receipt.includes('Enquiry received') && Boolean(ref));

  // 4. It is stored under that reference with the lane.
  const stored = (await readEnquiries()).find((e) => e.ref === ref);
  check('enquiry stored under its reference', stored?.name === 'Meridian Exports');
  check('enquiry keeps the lane', stored?.origin === 'Bengaluru' && stored?.destination === 'Nhava Sheva');

  // 5. The admin console is gone, not merely hidden.
  const admin = await fetch(`${B}/admin`);
  check('/admin is a 404 page', admin.status === 404);
  const api = await fetch(`${B}/api/admin/enquiries`);
  check('admin API no longer exists', api.status === 404);
  const robots = await fetch(`${B}/robots.txt`).then((r) => r.text());
  check('robots.txt no longer mentions /admin', !robots.includes('/admin'));
} finally {
  await browser.close();
}

console.log(fails.length ? `\n${fails.length} FAILED` : '\nAll checks passed');
process.exit(fails.length ? 1 : 0);
