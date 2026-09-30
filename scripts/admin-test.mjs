/**
 * Exercises every section of the admin console the way a person would:
 * sign in, open each panel, change something, save it, confirm the public
 * site reflects it, then put it back.
 */
import 'dotenv/config';
import { chromium } from 'playwright';

const B = process.env.BASE_URL || 'http://localhost:4000';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

const fails = [];
const check = (l, ok, note = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${l}${note ? `  — ${note}` : ''}`);
  if (!ok) fails.push(l);
};
const section = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 46 - t.length))}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const restore = [];

async function save() {
  const button = page.locator('button[type=submit]').first();
  if (!(await button.isEnabled())) return 'not-dirty';
  await button.click();
  await page.waitForTimeout(1000);
  const body = await page.textContent('body');
  if (body.includes('live site is updated')) return 'saved';
  if (body.includes('highlighted fields')) return 'validation';
  return 'unknown';
}

const publicSite = () => fetch(`${B}/api/site`).then((r) => r.json());

try {
  section('Sign in');
  await page.goto(`${B}/admin`, { waitUntil: 'networkidle' });
  check('sign-in page reachable', await page.locator('#field-password').count() === 1);

  await page.fill('#field-email', EMAIL);
  await page.fill('#field-password', 'definitely-wrong');
  await page.click('button[type=submit]');
  await page.waitForTimeout(900);
  check('wrong password rejected', (await page.textContent('body')).includes('incorrect'));

  await page.fill('#field-email', EMAIL);
  await page.fill('#field-password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForTimeout(1400);
  check('signs in with the real credentials', (await page.textContent('body')).includes('Enquiries'), EMAIL);

  section('Navigation');
  const NAV = ['Enquiries', 'Contact details', 'Home page', 'About page', 'Services',
               'Lane board', 'FAQs', 'Contact pop-up', 'Search listing', 'Email alerts', 'Your account'];
  for (const label of NAV) {
    await page.getByRole('link', { name: new RegExp(`^${label}`) }).first().click();
    await page.waitForTimeout(650);
    const heading = await page.locator('h1').first().textContent().catch(() => '');
    check(`opens "${label}"`, heading.trim().length > 0, heading.trim());
  }

  section('Contact details — edit and verify live');
  await page.getByRole('link', { name: /^Contact details/ }).click();
  await page.waitForSelector('#field-phone');
  const originalPhone = await page.inputValue('#field-phone');
  const originalHours = await page.inputValue('#field-hours');
  restore.push(async () => {
    await page.getByRole('link', { name: /^Contact details/ }).click();
    await page.waitForSelector('#field-phone');
    await page.fill('#field-phone', originalPhone);
    await page.fill('#field-hours', originalHours);
    await save();
  });

  await page.fill('#field-phone', '+91 90000 11111');
  await page.fill('#field-hours', 'Mon–Sat, 8:00 – 20:00 IST');
  check('contact details save', await save() === 'saved');
  let site = await publicSite();
  check('public API reflects the phone', site.company.phone === '+91 90000 11111');
  check('public API reflects the hours', site.company.hours === 'Mon–Sat, 8:00 – 20:00 IST');

  await page.fill('#field-email', 'not-an-email');
  check('invalid email is rejected', await save() === 'validation');
  await page.reload({ waitUntil: 'networkidle' });

  section('Home page');
  await page.getByRole('link', { name: /^Home page/ }).click();
  await page.waitForSelector('#field-heading');
  const originalHeading = await page.inputValue('#field-heading');
  restore.push(async () => {
    await page.getByRole('link', { name: /^Home page/ }).click();
    await page.waitForSelector('#field-heading');
    await page.fill('#field-heading', originalHeading);
    await save();
  });
  await page.fill('#field-heading', 'Admin test headline');
  check('headline saves', await save() === 'saved');
  check('public API reflects the headline', (await publicSite()).home.heading === 'Admin test headline');
  await page.fill('#field-heading', '');
  check('empty headline is rejected', await save() === 'validation');
  await page.reload({ waitUntil: 'networkidle' });

  section('Services CRUD');
  await page.getByRole('link', { name: /^Services/ }).click();
  await page.waitForTimeout(700);
  const beforeCount = (await publicSite()).services.length;
  await page.getByRole('button', { name: '+ Add service' }).click();
  await page.waitForSelector('#field-svc-title');
  await page.fill('#field-svc-title', 'Admin Test Service');
  await page.fill('#field-svc-summary', 'Created by the automated admin test.');
  await page.getByRole('button', { name: 'Add service' }).click();
  await page.waitForTimeout(1100);
  let after = await publicSite();
  check('service created', after.services.length === beforeCount + 1);
  const created = after.services.find((s) => s.title === 'Admin Test Service');
  check('service reaches the public site', Boolean(created), created?.slug);

  await page.getByRole('button', { name: 'Edit' }).last().click();
  await page.waitForSelector('#field-svc-title');
  await page.fill('#field-svc-title', 'Admin Test Service Renamed');
  await page.getByRole('button', { name: 'Save service' }).click();
  await page.waitForTimeout(1100);
  check('service renamed', (await publicSite()).services.some((s) => s.title === 'Admin Test Service Renamed'));

  await page.getByRole('button', { name: 'Delete' }).last().click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await page.waitForTimeout(1100);
  check('service deleted', (await publicSite()).services.length === beforeCount);

  section('FAQs CRUD');
  await page.getByRole('link', { name: /^FAQs/ }).click();
  await page.waitForTimeout(700);
  const faqsBefore = (await publicSite()).faqs.length;
  await page.getByRole('button', { name: '+ Add question' }).click();
  await page.waitForSelector('#field-faq-q');
  await page.fill('#field-faq-q', 'Admin test question?');
  await page.fill('#field-faq-a', 'Admin test answer.');
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.waitForTimeout(1100);
  check('FAQ created', (await publicSite()).faqs.length === faqsBefore + 1);
  await page.getByRole('button', { name: 'Delete' }).last().click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await page.waitForTimeout(1100);
  check('FAQ deleted', (await publicSite()).faqs.length === faqsBefore);

  section('Lane board');
  await page.getByRole('link', { name: /^Lane board/ }).click();
  await page.waitForTimeout(700);
  const lanesBefore = (await publicSite()).lanes.length;
  await page.getByRole('button', { name: '+ Add lane' }).click();
  await page.waitForTimeout(400);
  await page.fill(`#field-lane-origin-${lanesBefore}`, 'TST');
  await page.fill(`#field-lane-dest-${lanesBefore}`, 'XYZ');
  await page.fill(`#field-lane-service-${lanesBefore}`, 'TEST');
  check('lane added and saved', await save() === 'saved');
  check('lane visible publicly', (await publicSite()).lanes.length === lanesBefore + 1);
  await page.getByRole('button', { name: 'Remove' }).last().click();
  check('lane removed', await save() === 'saved');
  check('lane count restored', (await publicSite()).lanes.length === lanesBefore);

  section('Pop-up and search listing');
  await page.getByRole('link', { name: /^Contact pop-up/ }).click();
  await page.waitForSelector('#field-delaySeconds');
  check('pop-up delay is 10s', await page.inputValue('#field-delaySeconds') === '10');
  await page.getByRole('link', { name: /^Search listing/ }).click();
  await page.waitForSelector('#field-title');
  const seoTitle = await page.inputValue('#field-title');
  check('search title loaded', seoTitle.length > 0, `${seoTitle.length} chars`);
  check('search preview rendered', (await page.textContent('body')).includes('chars'));

  section('Email alerts');
  await page.getByRole('link', { name: /^Email alerts/ }).click();
  await page.waitForTimeout(900);
  const mailBody = await page.textContent('body');
  check('email status shown', /Email notifications are (working|off)/.test(mailBody));
  check('setup guidance present', mailBody.includes('App Password'));

  section('Enquiry inbox');
  const ref = await fetch(`${B}/api/enquiries`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      kind: 'quote', scope: 'domestic', name: 'Admin Portal Test',
      email: 'portal@test.example', phone: '+91 98450 60606',
      origin: 'Bengaluru Urban, Karnataka',
      destination: 'Pune, Maharashtra', weight: '900 kg'
    })
  }).then((r) => r.json()).then((d) => d.ref);
  check('enquiry accepted by the API', /^HNXT-\d{5}$/.test(ref), ref);

  await page.getByRole('link', { name: /^Enquiries/ }).click();
  await page.waitForTimeout(1000);
  check('enquiry appears in the inbox', (await page.textContent('body')).includes('Admin Portal Test'));

  await page.getByRole('button', { name: /Admin Portal Test/ }).first().click();
  await page.waitForTimeout(500);
  const detail = await page.textContent('body');
  check('detail shows the lane', detail.includes('Bengaluru Urban') && detail.includes('Pune'));
  check('detail shows the shipment type', detail.includes('Within India'));
  check('delivery status shown', /Emailed to you|Saved here only/.test(detail));

  await page.getByRole('button', { name: 'Mark in-progress' }).click();
  await page.waitForTimeout(900);
  check('status can be changed', (await page.textContent('body')).includes('in-progress'));

  await page.getByRole('button', { name: 'Delete' }).last().click();
  await page.getByRole('button', { name: 'Yes' }).last().click();
  await page.waitForTimeout(900);
  check('enquiry deleted', !(await page.textContent('body')).includes('Admin Portal Test'));

  section('Account and session');
  await page.getByRole('link', { name: /^Your account/ }).click();
  await page.waitForTimeout(800);
  check('account email shown', (await page.textContent('body')).includes(EMAIL));
  check('activity log populated', (await page.textContent('body')).includes('content.update'));

  await page.fill('#field-currentPassword', 'wrong-password');
  await page.fill('#field-newPassword', 'a-long-enough-password');
  await page.fill('#field-confirmPassword', 'a-long-enough-password');
  await page.getByRole('button', { name: 'Change password' }).click();
  await page.waitForTimeout(900);
  check('wrong current password rejected', (await page.textContent('body')).includes('incorrect'));

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForTimeout(900);
  check('sign out returns to the login form', await page.locator('#field-password').count() === 1);

  const guarded = await page.evaluate(async () => (await fetch('/api/admin/enquiries')).status);
  check('session is gone after sign out', guarded === 401);
} finally {
  section('Restore');
  try {
    if (await page.locator('#field-password').count()) {
      await page.fill('#field-email', EMAIL);
      await page.fill('#field-password', PASSWORD);
      await page.click('button[type=submit]');
      await page.waitForTimeout(1300);
    }
    for (const undo of restore) await undo();
    const site = await publicSite();
    check('contact details restored', site.company.phone === '');
    check('headline restored', site.home.heading.startsWith('Cargo moves'));
  } catch (err) {
    check('restore completed', false, err.message);
  }
  await browser.close();
}

console.log(fails.length ? `\n${fails.length} FAILED` : '\nAll admin portal checks passed');
process.exit(fails.length ? 1 : 0);
